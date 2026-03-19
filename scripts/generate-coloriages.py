#!/usr/bin/env python3
"""
Coloring page image generation pipeline.

Generates A4 300dpi black-and-white line art images and produces the matching
Astro content collection YAML files.

Supported backends:
  - dalle3   : OpenAI DALL-E 3 (default). Requires OPENAI_API_KEY.
  - gemini   : Google Imagen 3 ("Nano Banana" per CEO). Requires GEMINI_API_KEY.

Usage:
    python3 scripts/generate-coloriages.py --all --dry-run
    python3 scripts/generate-coloriages.py --category animaux
    python3 scripts/generate-coloriages.py --category vehicules --count 3
    python3 scripts/generate-coloriages.py --all --locale fr
    python3 scripts/generate-coloriages.py --category animaux --count 3 --backend gemini
    python3 scripts/generate-coloriages.py --category animaux --count 3 --compare  # A/B test both

Requirements:
    pip install openai pillow pyyaml google-genai
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import yaml
from datetime import timezone

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
PROMPTS_FILE = SCRIPT_DIR / "coloriages-prompts.yaml"

# DALL-E 3 generates 1024x1792 (portrait), we upscale to A4 300dpi
DALLE_SIZE = "1024x1792"
A4_WIDTH_PX = 2480   # A4 at 300 DPI
A4_HEIGHT_PX = 3508  # A4 at 300 DPI

# Rate limiting: tier-1 DALL-E 3 = ~5 images/min, so ~13s between calls
RATE_LIMIT_SECONDS_DALLE = 13
# Gemini Imagen 3: generous quota, 2s is safe
RATE_LIMIT_SECONDS_GEMINI = 2

# Gemini Imagen 3 model (CEO calls it "Nano Banana")
GEMINI_IMAGEN_MODEL = "imagen-3.0-generate-002"
# Aspect ratio closest to A4 (1:√2 ≈ 3:4.24); 3:4 is nearest available
GEMINI_ASPECT_RATIO = "3:4"

LINE_ART_SUFFIX = (
    "Coloring book page style for children. Thick clean black outlines on a "
    "pure white background. No shading, no color fill, no gradients. Simple "
    "bold shapes. Cute friendly cartoon style. High contrast, printable quality."
)

# ---------------------------------------------------------------------------
# Path helpers (resolved relative to ASTRO_ROOT env var or auto-detected)
# ---------------------------------------------------------------------------

def get_astro_root() -> Path:
    env_root = os.environ.get("ASTRO_ROOT")
    if env_root:
        return Path(env_root).resolve()
    # Auto-detect: walk up from script until we find astro.config.mjs
    candidate = SCRIPT_DIR.parent
    for _ in range(5):
        if (candidate / "astro.config.mjs").exists():
            return candidate
        candidate = candidate.parent
    raise RuntimeError(
        "Cannot find Astro project root. Set ASTRO_ROOT env var or run from "
        "within the Astro project."
    )


def get_images_dir(astro_root: Path) -> Path:
    d = astro_root / "public" / "images" / "coloriages"
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_content_dir(astro_root: Path, locale: str) -> Path:
    d = astro_root / "src" / "content" / "coloriages" / locale
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_logs_dir(astro_root: Path) -> Path:
    d = astro_root / "data" / "generation-logs"
    d.mkdir(parents=True, exist_ok=True)
    return d


# ---------------------------------------------------------------------------
# Image generation backends
# ---------------------------------------------------------------------------

def build_prompt(subject_prompt: str, base_suffix: str) -> str:
    return f"{subject_prompt} {base_suffix} {LINE_ART_SUFFIX}"


def generate_image_dalle(client, prompt: str) -> bytes:
    """Call DALL-E 3 and return raw PNG bytes."""
    import base64
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size=DALLE_SIZE,
        quality="standard",
        n=1,
        response_format="b64_json",
    )
    return base64.b64decode(response.data[0].b64_json)


def generate_image_gemini(client, prompt: str) -> bytes:
    """Call Google Imagen 3 ("Nano Banana") and return raw PNG bytes."""
    try:
        from google.genai import types as genai_types
    except ImportError:
        raise ImportError("google-genai package not installed. Run: pip install google-genai")

    response = client.models.generate_images(
        model=GEMINI_IMAGEN_MODEL,
        prompt=prompt,
        config=genai_types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio=GEMINI_ASPECT_RATIO,
            output_mime_type="image/png",
            safety_filter_level="BLOCK_ONLY_HIGH",
        ),
    )
    if not response.generated_images:
        raise RuntimeError("Gemini Imagen returned no images (possibly filtered)")
    return response.generated_images[0].image.image_bytes


def upscale_to_a4(image_bytes: bytes) -> bytes:
    """Convert image bytes to grayscale A4 300dpi PNG via Pillow."""
    from PIL import Image
    import io

    img = Image.open(io.BytesIO(image_bytes)).convert("L")  # grayscale
    img = img.resize((A4_WIDTH_PX, A4_HEIGHT_PX), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="PNG", dpi=(300, 300), optimize=False)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Astro content YAML generation
# ---------------------------------------------------------------------------

def make_content_yaml(subject: dict, locale: str, image_slug: str) -> dict:
    """Build the Astro content collection YAML dict for one locale."""
    is_fr = locale == "fr"
    slug_key = "fr_slug" if is_fr else "en_slug"
    title_key = "fr_title" if is_fr else "en_title"
    tags_key = "fr_tags" if is_fr else "en_tags"

    slug = subject[slug_key]
    title = subject[title_key]
    tags = subject.get(tags_key, [])

    # Derive category from fr_slug prefix (e.g. "animaux-chat" → "animaux")
    fr_slug = subject["fr_slug"]
    category = fr_slug.split("-")[0]

    if is_fr:
        alt = f"Coloriage {title.lower()} a imprimer, dessin au trait simple pour enfants"
        seo_title = f"Coloriage {title} a imprimer gratuitement | Coloriages"
        seo_desc = (
            f"Telecharge et imprime gratuitement ce coloriage de {title.lower()}. "
            "Parfait pour les enfants de 3 a 8 ans. Format A4, haute qualite."
        )
    else:
        alt = f"Coloring page of {title.lower()}, simple line drawing for children"
        seo_title = f"Free {title} Coloring Page to Print | Coloring Pages"
        seo_desc = (
            f"Download and print this free {title.lower()} coloring page. "
            "Perfect for children aged 3 to 8. High quality A4 format."
        )

    return {
        "title": title,
        "slug": slug,
        "category": category,
        "tags": tags,
        "image": f"/images/coloriages/{image_slug}.png",
        "alt": alt,
        "locale": locale,
        "seoTitle": seo_title,
        "seoDescription": seo_desc,
        "printable": True,
    }


def write_content_yaml(content: dict, content_dir: Path, filename: str) -> Path:
    out_path = content_dir / filename
    with open(out_path, "w", encoding="utf-8") as f:
        yaml.dump(content, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
    return out_path


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def process_subject(
    subject: dict,
    base_suffix: str,
    images_dir: Path,
    astro_root: Path,
    locales: list[str],
    client,
    dry_run: bool,
    log_entries: list,
    backend: str = "dalle3",
    image_suffix: str = "",
):
    """Generate one image (and content YAMLs) for a subject.

    image_suffix: appended to filename stem for A/B comparisons (e.g. "-gemini").
    """
    fr_slug = subject["fr_slug"]
    en_slug = subject["en_slug"]
    image_slug = fr_slug + image_suffix
    image_path = images_dir / f"{image_slug}.png"

    prompt = build_prompt(subject["prompt"], base_suffix)

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "backend": backend,
        "fr_slug": fr_slug,
        "en_slug": en_slug,
        "prompt": prompt,
        "image_path": str(image_path),
        "dry_run": dry_run,
        "status": None,
        "content_files": [],
        "error": None,
    }

    if image_path.exists():
        print(f"  [skip] {image_slug}.png already exists")
        entry["status"] = "skipped"
        log_entries.append(entry)
        return True

    if dry_run:
        print(f"  [dry-run] [{backend}] Would generate: {image_slug}.png")
        print(f"            Prompt: {prompt[:80]}...")
        entry["status"] = "dry_run"
        log_entries.append(entry)
        return True

    print(f"  [gen] [{backend}] {image_slug}.png ...")
    try:
        if backend == "gemini":
            raw_bytes = generate_image_gemini(client, prompt)
        else:
            raw_bytes = generate_image_dalle(client, prompt)
        png_bytes = upscale_to_a4(raw_bytes)
        image_path.write_bytes(png_bytes)
        print(f"  [ok ] Saved {image_path.stat().st_size // 1024}KB → {image_path}")
    except Exception as e:
        print(f"  [err] Failed to generate {image_slug}: {e}", file=sys.stderr)
        entry["status"] = "error"
        entry["error"] = str(e)
        log_entries.append(entry)
        return False

    # Skip content YAMLs for A/B comparison images (they use a suffixed slug)
    if not image_suffix:
        for locale in locales:
            content = make_content_yaml(subject, locale, image_slug)
            slug = subject["fr_slug"] if locale == "fr" else subject["en_slug"]
            filename = f"{slug}.yaml"
            content_dir = get_content_dir(astro_root, locale)
            yaml_path = write_content_yaml(content, content_dir, filename)
            print(f"  [ok ] YAML → {yaml_path.relative_to(astro_root)}")
            entry["content_files"].append(str(yaml_path))

    entry["status"] = "success"
    log_entries.append(entry)
    return True


def run(args):
    # Load prompts
    with open(PROMPTS_FILE, encoding="utf-8") as f:
        config = yaml.safe_load(f)

    categories = config["categories"]
    base_suffix = config.get("base_prompt_suffix", "").strip()

    astro_root = get_astro_root()
    images_dir = get_images_dir(astro_root)
    logs_dir = get_logs_dir(astro_root)

    print(f"Astro root : {astro_root}")
    print(f"Images dir : {images_dir}")
    print(f"Dry run    : {args.dry_run}")

    # Determine which categories to process
    if args.all:
        selected = list(categories.keys())
    elif args.category:
        if args.category not in categories:
            print(f"Unknown category '{args.category}'. Available: {list(categories.keys())}", file=sys.stderr)
            sys.exit(1)
        selected = [args.category]
    else:
        print("Specify --all or --category <name>", file=sys.stderr)
        sys.exit(1)

    # Locales
    if args.locale == "both":
        locales = ["fr", "en"]
    else:
        locales = [args.locale]

    backend = args.backend
    compare_mode = getattr(args, "compare", False)

    # Init client(s)
    dalle_client = None
    gemini_client = None

    if not args.dry_run:
        needs_dalle = compare_mode or backend == "dalle3"
        needs_gemini = compare_mode or backend == "gemini"

        if needs_dalle:
            try:
                from openai import OpenAI
            except ImportError:
                print("openai package not installed. Run: pip install openai pillow pyyaml", file=sys.stderr)
                sys.exit(1)
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                print("OPENAI_API_KEY env var not set.", file=sys.stderr)
                sys.exit(1)
            dalle_client = OpenAI(api_key=api_key)

        if needs_gemini:
            try:
                from google import genai as google_genai
            except ImportError:
                print("google-genai package not installed. Run: pip install google-genai", file=sys.stderr)
                sys.exit(1)
            gemini_api_key = os.environ.get("GEMINI_API_KEY")
            if not gemini_api_key:
                print("GEMINI_API_KEY env var not set.", file=sys.stderr)
                sys.exit(1)
            gemini_client = google_genai.Client(api_key=gemini_api_key)

    log_entries = []
    total = 0
    success = 0
    first_call = True

    def _generate_one(subject, the_backend, the_client, img_suffix=""):
        nonlocal total, success, first_call
        total += 1
        rate_limit = RATE_LIMIT_SECONDS_DALLE if the_backend == "dalle3" else RATE_LIMIT_SECONDS_GEMINI
        if not args.dry_run and not first_call:
            print(f"  [wait] Rate limiting ({rate_limit}s)...")
            time.sleep(rate_limit)
        first_call = False
        ok = process_subject(
            subject=subject,
            base_suffix=base_suffix,
            images_dir=images_dir,
            astro_root=astro_root,
            locales=locales,
            client=the_client,
            dry_run=args.dry_run,
            log_entries=log_entries,
            backend=the_backend,
            image_suffix=img_suffix,
        )
        if ok:
            success += 1

    for cat_name in selected:
        subjects = categories[cat_name]["subjects"]
        count = args.count if args.count else len(subjects)
        print(f"\n=== Category: {cat_name} ({min(count, len(subjects))} subjects) ===")

        for subject in subjects[:count]:
            if compare_mode:
                # Generate both backends with suffixed filenames for side-by-side review
                _generate_one(subject, "dalle3", dalle_client, img_suffix="-dalle3")
                _generate_one(subject, "gemini", gemini_client, img_suffix="-gemini")
            else:
                the_client = gemini_client if backend == "gemini" else dalle_client
                _generate_one(subject, backend, the_client)

    # Write log
    log_file = logs_dir / f"generation-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump({"summary": {"total": total, "success": success, "dry_run": args.dry_run}, "entries": log_entries}, f, indent=2)

    print(f"\n=== Done: {success}/{total} ===")
    print(f"Log: {log_file}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate coloring page images via DALL-E 3 or Gemini Imagen 3.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run all categories
  python3 generate-coloriages.py --all --dry-run

  # Generate 3 images with DALL-E 3 (default)
  python3 generate-coloriages.py --category animaux --count 3

  # Generate with Gemini Imagen 3 ("Nano Banana")
  python3 generate-coloriages.py --category animaux --count 3 --backend gemini

  # A/B test: generate same prompts with both backends (adds -dalle3 / -gemini suffix)
  python3 generate-coloriages.py --category animaux --count 5 --compare
""",
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--all", action="store_true", help="Process all categories")
    group.add_argument("--category", metavar="NAME", help="Process a single category")
    parser.add_argument("--count", type=int, metavar="N", help="Max subjects per category (default: all)")
    parser.add_argument("--locale", choices=["fr", "en", "both"], default="both", help="Generate content YAML for locale(s) (default: both)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be done without calling the API")
    parser.add_argument(
        "--backend",
        choices=["dalle3", "gemini"],
        default="dalle3",
        help="Image generation backend: dalle3 (default) or gemini (Imagen 3)",
    )
    parser.add_argument(
        "--compare",
        action="store_true",
        help="A/B test mode: generate every prompt with BOTH backends (saves <slug>-dalle3.png and <slug>-gemini.png)",
    )
    args = parser.parse_args()

    if not args.all and not args.category:
        parser.print_help()
        sys.exit(1)

    run(args)


if __name__ == "__main__":
    main()
