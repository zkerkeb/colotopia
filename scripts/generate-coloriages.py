#!/usr/bin/env python3
"""
Coloring page image generation pipeline.

Generates A4 300dpi black-and-white line art images and produces the matching
Astro content collection YAML files.

Backends:
  - gemini (default): Google Gemini Imagen 4. Requires GEMINI_API_KEY.
  - openai: OpenAI gpt-image-1-mini. Requires OPENAI_API_KEY.

Usage:
    python3 scripts/generate-coloriages.py --all --dry-run
    python3 scripts/generate-coloriages.py --category animaux
    python3 scripts/generate-coloriages.py --category vehicules --count 3
    python3 scripts/generate-coloriages.py --all --locale fr
    python3 scripts/generate-coloriages.py --all --backend openai

Requirements:
    pip install pillow pyyaml google-genai openai
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml

# ---------------------------------------------------------------------------
# Auto-load .env file if present (so keys don't need manual export)
# ---------------------------------------------------------------------------

def _load_dotenv(env_path: Path):
    """Minimal .env loader — sets vars that aren't already in the environment."""
    if not env_path.exists():
        return
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

_load_dotenv(Path(__file__).parent.parent / ".env")


class QuotaExhaustedError(Exception):
    """Raised when the API quota is exhausted — stops the batch early."""
    pass


class QCFailedError(Exception):
    """Raised when a generated image fails quality control."""
    pass


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
PROMPTS_FILE = SCRIPT_DIR / "coloriages-prompts.yaml"

A4_WIDTH_PX = 2480   # A4 at 300 DPI
A4_HEIGHT_PX = 3508  # A4 at 300 DPI

# Gemini Imagen 4: ~10 RPM limit, 7s keeps us safely under
RATE_LIMIT_SECONDS = 7

# Gemini Imagen 4 model
GEMINI_IMAGEN_MODEL = "imagen-4.0-generate-001"
# Aspect ratio closest to A4 (1:√2 ≈ 3:4.24); 3:4 is nearest available
GEMINI_ASPECT_RATIO = "3:4"

# QC: max retries when an image fails quality control
MAX_QC_RETRIES = 2

# Exponential backoff delays (seconds) for 429 / RESOURCE_EXHAUSTED errors
BACKOFF_DELAYS = [30, 60, 120]

# Daily quota: max successful generations per calendar day (UTC)
DAILY_QUOTA_LIMIT = 70

# Queue file path (relative to astro root)
QUEUE_FILENAME = "data/generation-queue.json"

LINE_ART_SUFFIX_KIDS = (
    "Black and white line drawing for kids. Thick bold outlines, pure white "
    "background, cute cartoon style. No shading, no text."
)

LINE_ART_SUFFIX_ADULTS = (
    "Black and white line drawing. Clean outlines on pure white background. "
    "Intricate detailed patterns, fine lines. No shading, no text."
)

# Adult categories use the detailed adult prompt suffix
ADULT_CATEGORIES = {"mandalas", "mosaiques", "abstrait", "cartes", "paysages", "cottagecore", "vitrail", "zodiaque", "affirmations"}

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

def build_prompt(subject_prompt: str, base_suffix: str, category: str = "", adult_suffix: str = "") -> str:
    # Use only the code-level constant (not both YAML + code suffix — duplication
    # causes Gemini to render the prompt text ON the image).
    if category in ADULT_CATEGORIES:
        line_art = LINE_ART_SUFFIX_ADULTS
    else:
        line_art = LINE_ART_SUFFIX_KIDS
    return f"{subject_prompt} {line_art}"


def _is_rate_limit_error(error: Exception) -> bool:
    """Check if an error is a rate-limit / quota error that should trigger backoff."""
    error_str = str(error)
    return any(tok in error_str for tok in ("RESOURCE_EXHAUSTED", "429", "rate_limit", "Rate limit"))


def generate_with_backoff(generate_fn, *args, **kwargs) -> bytes:
    """Wrap a generation call with exponential backoff on rate-limit errors."""
    last_err = None
    for attempt, delay in enumerate([0] + BACKOFF_DELAYS):
        if delay:
            print(f"  [backoff] Rate limited — waiting {delay}s (attempt {attempt + 1}/{len(BACKOFF_DELAYS) + 1})...")
            time.sleep(delay)
        try:
            return generate_fn(*args, **kwargs)
        except Exception as e:
            if _is_rate_limit_error(e):
                last_err = e
                continue
            raise  # non-rate-limit errors propagate immediately
    raise QuotaExhaustedError(f"Still rate-limited after {len(BACKOFF_DELAYS)} retries: {last_err}")


def generate_image_gemini(client, prompt: str) -> bytes:
    """Call Google Imagen 4 and return raw PNG bytes."""
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
            safety_filter_level="BLOCK_LOW_AND_ABOVE",
        ),
    )
    if not response.generated_images:
        raise RuntimeError("Gemini Imagen returned no images (possibly filtered)")
    return response.generated_images[0].image.image_bytes


def generate_image_openai(client, prompt: str) -> bytes:
    """Call OpenAI gpt-image-1-mini and return raw PNG bytes."""
    response = client.images.generate(
        model="gpt-image-1-mini",
        prompt=prompt,
        size="1024x1536",
        quality="low",
    )
    b64_data = response.data[0].b64_json
    return base64.b64decode(b64_data)


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
# Post-generation quality control
# ---------------------------------------------------------------------------

def validate_line_art(png_bytes: bytes, category: str = "") -> dict:
    """Analyse pixel distribution to detect photos or non-colorable images.

    Returns a dict with keys: passed (bool), white_pct, black_pct, mid_pct, reason.
    """
    from PIL import Image
    import io

    img = Image.open(io.BytesIO(png_bytes)).convert("L")
    # Sample pixels (every 4th pixel for speed on large A4 images)
    pixels = list(img.getdata())[::4]
    total = len(pixels)

    white = sum(1 for p in pixels if p > 240)
    black = sum(1 for p in pixels if p < 30)
    mid = sum(1 for p in pixels if 50 < p < 200)

    white_pct = white / total * 100
    black_pct = black / total * 100
    mid_pct = mid / total * 100

    is_adult = category in ADULT_CATEGORIES

    # Hard reject: clearly a photograph (near-zero white)
    if white_pct < 5:
        return {
            "passed": False, "white_pct": white_pct, "black_pct": black_pct,
            "mid_pct": mid_pct, "reason": "photograph detected (white < 5%)",
        }

    if is_adult:
        # Adult patterns are denser — more lenient thresholds
        if mid_pct > 50:
            return {
                "passed": False, "white_pct": white_pct, "black_pct": black_pct,
                "mid_pct": mid_pct, "reason": "too much shading for adult pattern (mid > 50%)",
            }
    else:
        # Kids line art: mostly white background with clean black outlines
        if white_pct < 45:
            return {
                "passed": False, "white_pct": white_pct, "black_pct": black_pct,
                "mid_pct": mid_pct, "reason": f"not enough white space (white={white_pct:.0f}% < 45%)",
            }
        if mid_pct > 30:
            return {
                "passed": False, "white_pct": white_pct, "black_pct": black_pct,
                "mid_pct": mid_pct, "reason": f"too much shading (mid={mid_pct:.0f}% > 30%)",
            }

    return {
        "passed": True, "white_pct": white_pct, "black_pct": black_pct,
        "mid_pct": mid_pct, "reason": None,
    }


# ---------------------------------------------------------------------------
# Persistent queue & daily quota tracking
# ---------------------------------------------------------------------------

def _get_queue_path(astro_root: Path) -> Path:
    return astro_root / QUEUE_FILENAME


def _load_queue(astro_root: Path) -> dict:
    """Load or initialise the generation queue JSON."""
    path = _get_queue_path(astro_root)
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {"pending": [], "completed": [], "failed": [], "daily_counts": {}}


def _save_queue(astro_root: Path, queue: dict):
    path = _get_queue_path(astro_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, ensure_ascii=False)


def _today_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _daily_count(queue: dict) -> int:
    return queue.get("daily_counts", {}).get(_today_key(), 0)


def _increment_daily(queue: dict):
    key = _today_key()
    counts = queue.setdefault("daily_counts", {})
    counts[key] = counts.get(key, 0) + 1


def queue_add(astro_root: Path, categories: dict, selected_cats: list[str], count: int | None):
    """Add subjects from selected categories to the pending queue.

    Skips subjects whose image already exists or that are already queued.
    """
    queue = _load_queue(astro_root)
    images_dir = get_images_dir(astro_root)

    # Build sets for fast dedup
    already_queued = {item["fr_slug"] for item in queue["pending"]}
    already_done = {item["fr_slug"] for item in queue["completed"]}

    added = 0
    for cat_name in selected_cats:
        subjects = categories[cat_name]["subjects"]
        limit = count if count else len(subjects)
        for subject in subjects[:limit]:
            fr_slug = subject["fr_slug"]
            image_path = images_dir / f"{fr_slug}.png"

            if image_path.exists():
                continue
            if fr_slug in already_queued or fr_slug in already_done:
                continue

            queue["pending"].append({
                "fr_slug": fr_slug,
                "en_slug": subject["en_slug"],
                "prompt": subject["prompt"],
                "category": cat_name,
                "added_at": datetime.now(timezone.utc).isoformat(),
            })
            already_queued.add(fr_slug)
            added += 1

    _save_queue(astro_root, queue)
    print(f"[queue] Added {added} items → {len(queue['pending'])} pending total")
    return added


def queue_status(astro_root: Path):
    """Print queue status summary."""
    queue = _load_queue(astro_root)
    today = _today_key()
    today_count = _daily_count(queue)
    remaining_today = max(0, DAILY_QUOTA_LIMIT - today_count)

    print(f"=== Generation Queue Status ===")
    print(f"  Pending   : {len(queue['pending'])}")
    print(f"  Completed : {len(queue['completed'])}")
    print(f"  Failed    : {len(queue['failed'])}")
    print(f"  Today ({today}): {today_count}/{DAILY_QUOTA_LIMIT} generated ({remaining_today} remaining)")

    if queue["pending"]:
        print(f"\n  Next up:")
        for item in queue["pending"][:5]:
            print(f"    - {item['fr_slug']} ({item['category']})")
        if len(queue["pending"]) > 5:
            print(f"    ... and {len(queue['pending']) - 5} more")


def queue_run(
    astro_root: Path,
    config: dict,
    client,
    locales: list[str],
    dry_run: bool,
    backend: str,
):
    """Process pending queue items, respecting daily quota and rate limits."""
    queue = _load_queue(astro_root)
    images_dir = get_images_dir(astro_root)
    logs_dir = get_logs_dir(astro_root)
    base_suffix = config.get("base_prompt_suffix", "").strip()
    adult_suffix = config.get("adult_prompt_suffix", "").strip()

    if not queue["pending"]:
        print("[queue] Nothing pending.")
        return

    today_count = _daily_count(queue)
    remaining = DAILY_QUOTA_LIMIT - today_count
    if remaining <= 0 and not dry_run:
        print(f"[queue] Daily quota reached ({today_count}/{DAILY_QUOTA_LIMIT}). Try again tomorrow.")
        return

    log_entries = []
    processed = 0
    success = 0
    first_call = True

    # Work through pending items
    still_pending = []
    for item in queue["pending"]:
        if not dry_run and remaining <= 0:
            print(f"\n[queue] Daily quota reached ({DAILY_QUOTA_LIMIT}/{DAILY_QUOTA_LIMIT}). Stopping.")
            still_pending.append(item)
            continue

        # Reconstruct subject dict for process_subject
        subject = {
            "fr_slug": item["fr_slug"],
            "en_slug": item["en_slug"],
            "prompt": item["prompt"],
            "category": item["category"],
        }

        if not dry_run and not first_call:
            print(f"  [wait] Rate limiting ({RATE_LIMIT_SECONDS}s)...")
            time.sleep(RATE_LIMIT_SECONDS)
        first_call = False

        try:
            ok = process_subject(
                subject=subject,
                base_suffix=base_suffix,
                images_dir=images_dir,
                astro_root=astro_root,
                locales=locales,
                client=client,
                dry_run=dry_run,
                log_entries=log_entries,
                adult_suffix=adult_suffix,
                backend=backend,
            )
        except QuotaExhaustedError:
            print("\n[queue] API quota exhausted — saving progress.", file=sys.stderr)
            still_pending.append(item)
            # Keep remaining items pending too
            idx = queue["pending"].index(item)
            still_pending.extend(queue["pending"][idx + 1:])
            break

        processed += 1
        if ok:
            success += 1
            if not dry_run:
                _increment_daily(queue)
                remaining -= 1
                item["completed_at"] = datetime.now(timezone.utc).isoformat()
                queue["completed"].append(item)
            else:
                still_pending.append(item)  # keep in queue for dry runs
        else:
            if not dry_run:
                item["failed_at"] = datetime.now(timezone.utc).isoformat()
                queue["failed"].append(item)
            else:
                still_pending.append(item)
            continue

    # Update pending list with remaining items
    queue["pending"] = still_pending
    if not dry_run:
        _save_queue(astro_root, queue)

    # Write generation log
    log_file = logs_dir / f"generation-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump({"summary": {"total": processed, "success": success, "dry_run": dry_run, "mode": "queue"}, "entries": log_entries}, f, indent=2)

    print(f"\n=== Queue run: {success}/{processed} succeeded, {len(queue['pending'])} still pending ===")
    print(f"Log: {log_file}")

    # Run image optimization if we generated anything
    if success > 0 and not dry_run:
        print("\n=== Running image optimization (WebP + thumbnails) ===")
        optimize_script = astro_root / "scripts" / "optimize-images.mjs"
        result = subprocess.run(["node", str(optimize_script)], cwd=str(astro_root))
        if result.returncode != 0:
            print("[warn] Image optimization failed — run 'npm run optimize-images' manually.", file=sys.stderr)


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
    category = subject.get("category", fr_slug.split("-")[0])
    audience = "adultes" if category in ADULT_CATEGORIES else "enfants"

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
        "audience": audience,
        "tags": tags,
        "image": f"/images/coloriages/{image_slug}.png",
        "alt": alt,
        "locale": locale,
        "seoTitle": seo_title,
        "seoDescription": seo_desc,
        "printable": True,
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
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
    adult_suffix: str = "",
    backend: str = "gemini",
):
    """Generate one image (and content YAMLs) for a subject."""
    fr_slug = subject["fr_slug"]
    en_slug = subject["en_slug"]
    image_slug = fr_slug
    image_path = images_dir / f"{image_slug}.png"

    category = subject.get("category", fr_slug.split("-")[0])
    prompt = build_prompt(subject["prompt"], base_suffix, category, adult_suffix)

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
        print(f"  [dry-run] Would generate: {image_slug}.png")
        print(f"            Prompt: {prompt[:80]}...")
        entry["status"] = "dry_run"
        log_entries.append(entry)
        return True

    print(f"  [gen] {image_slug}.png ({backend}) ...")
    png_bytes = None
    last_qc = None
    for attempt in range(1, MAX_QC_RETRIES + 2):  # 1 initial + MAX_QC_RETRIES retries
        try:
            if backend == "openai":
                raw_bytes = generate_with_backoff(generate_image_openai, client, prompt)
            else:
                raw_bytes = generate_with_backoff(generate_image_gemini, client, prompt)
            candidate = upscale_to_a4(raw_bytes)
        except QuotaExhaustedError:
            entry["status"] = "error"
            entry["error"] = "quota exhausted after backoff retries"
            log_entries.append(entry)
            raise
        except Exception as e:
            error_str = str(e)
            print(f"  [err] Failed to generate {image_slug}: {error_str}", file=sys.stderr)
            entry["status"] = "error"
            entry["error"] = error_str
            log_entries.append(entry)
            return False

        # --- Quality control ---
        qc = validate_line_art(candidate, category)
        last_qc = qc
        if qc["passed"]:
            png_bytes = candidate
            print(f"  [qc ] PASS (white={qc['white_pct']:.0f}% mid={qc['mid_pct']:.0f}%)")
            break
        else:
            print(f"  [qc ] FAIL attempt {attempt}: {qc['reason']}")
            if attempt <= MAX_QC_RETRIES:
                print(f"  [qc ] Retrying ({attempt}/{MAX_QC_RETRIES})...")
                time.sleep(RATE_LIMIT_SECONDS)

    if png_bytes is None:
        entry["status"] = "qc_failed"
        entry["error"] = f"QC failed after {MAX_QC_RETRIES + 1} attempts: {last_qc['reason']}"
        entry["qc"] = last_qc
        log_entries.append(entry)
        print(f"  [err] QC REJECTED {image_slug} — {last_qc['reason']}", file=sys.stderr)
        return False

    image_path.write_bytes(png_bytes)
    entry["qc"] = last_qc
    print(f"  [ok ] Saved {image_path.stat().st_size // 1024}KB → {image_path}")

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
    adult_suffix = config.get("adult_prompt_suffix", "").strip()

    astro_root = get_astro_root()
    images_dir = get_images_dir(astro_root)
    logs_dir = get_logs_dir(astro_root)
    backend = args.backend

    print(f"Astro root : {astro_root}")
    print(f"Images dir : {images_dir}")
    print(f"Backend    : {backend}")
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

    # Init API client based on backend
    api_client = None

    if not args.dry_run:
        if backend == "openai":
            try:
                from openai import OpenAI
            except ImportError:
                print("openai package not installed. Run: pip install openai", file=sys.stderr)
                sys.exit(1)
            openai_api_key = os.environ.get("OPENAI_API_KEY")
            if not openai_api_key:
                print("OPENAI_API_KEY env var not set.", file=sys.stderr)
                sys.exit(1)
            api_client = OpenAI(api_key=openai_api_key)
        else:
            try:
                from google import genai as google_genai
            except ImportError:
                print("google-genai package not installed. Run: pip install google-genai", file=sys.stderr)
                sys.exit(1)
            gemini_api_key = os.environ.get("GEMINI_API_KEY")
            if not gemini_api_key:
                print("GEMINI_API_KEY env var not set.", file=sys.stderr)
                sys.exit(1)
            api_client = google_genai.Client(api_key=gemini_api_key)

    log_entries = []
    total = 0
    success = 0
    first_call = True

    quota_hit = False
    for cat_name in selected:
        if quota_hit:
            break
        subjects = categories[cat_name]["subjects"]
        count = args.count if args.count else len(subjects)
        print(f"\n=== Category: {cat_name} ({min(count, len(subjects))} subjects) ===")

        for subject in subjects[:count]:
            subject["category"] = cat_name  # Ensure correct category for hyphenated names
            total += 1
            if not args.dry_run and not first_call:
                print(f"  [wait] Rate limiting ({RATE_LIMIT_SECONDS}s)...")
                time.sleep(RATE_LIMIT_SECONDS)
            first_call = False
            try:
                ok = process_subject(
                    subject=subject,
                    base_suffix=base_suffix,
                    images_dir=images_dir,
                    astro_root=astro_root,
                    locales=locales,
                    client=api_client,
                    dry_run=args.dry_run,
                    log_entries=log_entries,
                    adult_suffix=adult_suffix,
                    backend=backend,
                )
                if ok:
                    success += 1
            except QuotaExhaustedError:
                print("\n[STOP] API quota exhausted — stopping batch to avoid wasting calls.", file=sys.stderr)
                quota_hit = True
                break

    # Write log
    log_file = logs_dir / f"generation-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}.json"
    with open(log_file, "w", encoding="utf-8") as f:
        json.dump({"summary": {"total": total, "success": success, "dry_run": args.dry_run}, "entries": log_entries}, f, indent=2)

    print(f"\n=== Done: {success}/{total} ===")
    print(f"Log: {log_file}")

    # Auto-generate WebP thumbnails for any new images
    if success > 0 and not args.dry_run:
        print("\n=== Running image optimization (WebP + thumbnails) ===")
        optimize_script = astro_root / "scripts" / "optimize-images.mjs"
        result = subprocess.run(
            ["node", str(optimize_script)],
            cwd=str(astro_root),
        )
        if result.returncode != 0:
            print("[warn] Image optimization failed — run 'npm run optimize-images' manually.", file=sys.stderr)


def run_audit(args):
    """Scan existing images and report QC pass/fail for each."""
    with open(PROMPTS_FILE, encoding="utf-8") as f:
        config = yaml.safe_load(f)

    astro_root = get_astro_root()
    images_dir = get_images_dir(astro_root)

    # Build slug→category map from prompts config
    slug_category = {}
    for cat_name, cat_data in config["categories"].items():
        for subj in cat_data["subjects"]:
            slug_category[subj["fr_slug"]] = cat_name

    failures = []
    passes = 0
    for png in sorted(images_dir.glob("*.png")):
        slug = png.stem
        category = slug_category.get(slug, slug.split("-")[0])
        qc = validate_line_art(png.read_bytes(), category)
        if qc["passed"]:
            passes += 1
        else:
            failures.append((slug, qc))
            print(f"  FAIL  {slug:45s} {qc['reason']}  (white={qc['white_pct']:.0f}% mid={qc['mid_pct']:.0f}%)")

    print(f"\n=== Audit: {passes} passed, {len(failures)} failed out of {passes + len(failures)} ===")
    if failures and args.delete:
        for slug, qc in failures:
            for path in [
                images_dir / f"{slug}.png",
                images_dir / f"{slug}.webp",
                images_dir / "thumbs" / f"{slug}.webp",
            ]:
                if path.exists():
                    path.unlink()
                    print(f"  [del] {path}")
        print("  Deleted failed images. Re-run generation to recreate them.")


def run_queue_add(args):
    """Add subjects to the generation queue."""
    with open(PROMPTS_FILE, encoding="utf-8") as f:
        config = yaml.safe_load(f)
    categories = config["categories"]
    astro_root = get_astro_root()

    if args.queue_cat:
        if args.queue_cat not in categories:
            print(f"Unknown category '{args.queue_cat}'. Available: {list(categories.keys())}", file=sys.stderr)
            sys.exit(1)
        selected = [args.queue_cat]
    else:
        selected = list(categories.keys())

    queue_add(astro_root, categories, selected, args.count)


def run_queue_status(args):
    """Show queue status."""
    astro_root = get_astro_root()
    queue_status(astro_root)


def run_queue_run(args):
    """Process the pending queue."""
    with open(PROMPTS_FILE, encoding="utf-8") as f:
        config = yaml.safe_load(f)

    astro_root = get_astro_root()
    backend = args.backend

    # Locales
    if args.locale == "both":
        locales = ["fr", "en"]
    else:
        locales = [args.locale]

    # Init API client
    api_client = None
    if not args.dry_run:
        if backend == "openai":
            try:
                from openai import OpenAI
            except ImportError:
                print("openai package not installed. Run: pip install openai", file=sys.stderr)
                sys.exit(1)
            openai_api_key = os.environ.get("OPENAI_API_KEY")
            if not openai_api_key:
                print("OPENAI_API_KEY env var not set.", file=sys.stderr)
                sys.exit(1)
            api_client = OpenAI(api_key=openai_api_key)
        else:
            try:
                from google import genai as google_genai
            except ImportError:
                print("google-genai package not installed. Run: pip install google-genai", file=sys.stderr)
                sys.exit(1)
            gemini_api_key = os.environ.get("GEMINI_API_KEY")
            if not gemini_api_key:
                print("GEMINI_API_KEY env var not set.", file=sys.stderr)
                sys.exit(1)
            api_client = google_genai.Client(api_key=gemini_api_key)

    queue_run(
        astro_root=astro_root,
        config=config,
        client=api_client,
        locales=locales,
        dry_run=args.dry_run,
        backend=backend,
    )


def main():
    parser = argparse.ArgumentParser(
        description="Generate coloring page images via Gemini Imagen 4 or OpenAI gpt-image-1.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run all categories
  python3 generate-coloriages.py --all --dry-run

  # Generate 3 images in a category
  python3 generate-coloriages.py --category animaux --count 3

  # Queue: add all missing images to the queue
  python3 generate-coloriages.py --queue-add

  # Queue: add a single category
  python3 generate-coloriages.py --queue-add --queue-cat mandalas

  # Queue: check status
  python3 generate-coloriages.py --queue-status

  # Queue: process pending items (respects 70/day quota)
  python3 generate-coloriages.py --queue-run

  # Queue: dry-run to see what would be processed
  python3 generate-coloriages.py --queue-run --dry-run

  # Audit existing images for QC failures
  python3 generate-coloriages.py --audit

  # Audit and auto-delete failures
  python3 generate-coloriages.py --audit --delete
""",
    )
    # Main mode (mutually exclusive)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--all", action="store_true", help="Process all categories (direct generation)")
    mode.add_argument("--category", metavar="NAME", help="Process a single category (direct generation)")
    mode.add_argument("--audit", action="store_true", help="Scan existing images for QC failures")
    mode.add_argument("--queue-add", action="store_true", help="Add subjects to the generation queue (use with --queue-cat or defaults to all)")
    mode.add_argument("--queue-run", action="store_true", help="Process pending queue items (respects daily quota)")
    mode.add_argument("--queue-status", action="store_true", help="Show generation queue status")
    parser.add_argument("--queue-cat", metavar="NAME", help="Category filter for --queue-add (default: all categories)")
    parser.add_argument("--count", type=int, metavar="N", help="Max subjects per category (default: all)")
    parser.add_argument("--locale", choices=["fr", "en", "both"], default="both", help="Generate content YAML for locale(s) (default: both)")
    parser.add_argument("--backend", choices=["gemini", "openai"], default="gemini", help="Image generation backend (default: gemini)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be done without calling the API")
    parser.add_argument("--delete", action="store_true", help="With --audit, delete failed images")
    args = parser.parse_args()

    if args.audit:
        run_audit(args)
        return

    if args.queue_status:
        run_queue_status(args)
        return

    if args.queue_add:
        run_queue_add(args)
        return

    if args.queue_run:
        run_queue_run(args)
        return

    if not args.all and not args.category:
        parser.print_help()
        sys.exit(1)

    run(args)


if __name__ == "__main__":
    main()
