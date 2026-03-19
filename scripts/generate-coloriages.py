#!/usr/bin/env python3
"""
Coloring page image generation pipeline.

Generates A4 300dpi black-and-white line art images via DALL-E 3 and
produces the matching Astro content collection YAML files.

Usage:
    python3 scripts/generate-coloriages.py --all --dry-run
    python3 scripts/generate-coloriages.py --category animaux
    python3 scripts/generate-coloriages.py --category vehicules --count 3
    python3 scripts/generate-coloriages.py --all --locale fr

Requirements:
    pip install openai pillow pyyaml
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
RATE_LIMIT_SECONDS = 13

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
# DALL-E 3 generation
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
):
    fr_slug = subject["fr_slug"]
    en_slug = subject["en_slug"]
    # Image filename uses fr_slug (shared between locales)
    image_slug = fr_slug
    image_path = images_dir / f"{image_slug}.png"

    prompt = build_prompt(subject["prompt"], base_suffix)

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
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
        print(f"  [dry-run] Would generate: {image_slug}.png")
        print(f"            Prompt: {prompt[:80]}...")
        entry["status"] = "dry_run"
        log_entries.append(entry)
        return True

    print(f"  [gen] {image_slug}.png ...")
    try:
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

    # Write content YAML for each locale
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

    # Init OpenAI client (only if not dry-run)
    client = None
    if not args.dry_run:
        try:
            from openai import OpenAI
        except ImportError:
            print("openai package not installed. Run: pip install openai pillow pyyaml", file=sys.stderr)
            sys.exit(1)
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("OPENAI_API_KEY env var not set.", file=sys.stderr)
            sys.exit(1)
        client = OpenAI(api_key=api_key)

    log_entries = []
    total = 0
    success = 0
    first_call = True

    for cat_name in selected:
        subjects = categories[cat_name]["subjects"]
        count = args.count if args.count else len(subjects)
        print(f"\n=== Category: {cat_name} ({min(count, len(subjects))} subjects) ===")

        for subject in subjects[:count]:
            total += 1
            # Rate limit: wait between API calls
            if not args.dry_run and not first_call:
                print(f"  [wait] Rate limiting ({RATE_LIMIT_SECONDS}s)...")
                time.sleep(RATE_LIMIT_SECONDS)
            first_call = False

            ok = process_subject(
                subject=subject,
                base_suffix=base_suffix,
                images_dir=images_dir,
                astro_root=astro_root,
                locales=locales,
                client=client,
                dry_run=args.dry_run,
                log_entries=log_entries,
            )
            if ok:
                success += 1

    # Write log
    log_file = logs_dir / f"generation-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump({"summary": {"total": total, "success": success, "dry_run": args.dry_run}, "entries": log_entries}, f, indent=2)

    print(f"\n=== Done: {success}/{total} ===")
    print(f"Log: {log_file}")


def main():
    parser = argparse.ArgumentParser(description="Generate coloring page images via DALL-E 3.")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--all", action="store_true", help="Process all categories")
    group.add_argument("--category", metavar="NAME", help="Process a single category")
    parser.add_argument("--count", type=int, metavar="N", help="Max subjects per category (default: all)")
    parser.add_argument("--locale", choices=["fr", "en", "both"], default="both", help="Generate content YAML for locale(s) (default: both)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be done without calling the API")
    args = parser.parse_args()

    if not args.all and not args.category:
        parser.print_help()
        sys.exit(1)

    run(args)


if __name__ == "__main__":
    main()
