#!/usr/bin/env python3
"""
Automated regeneration of flagged coloring pages.

Full pipeline:
  1. Fetch flagged items from the Colotopia admin API (both FR+EN metadata)
  2. Queue them in generation-queue.json (prepended for priority)
  3. Delete existing local PNG/WebP so generator treats them as missing
  4. Run generation via Gemini Imagen 4 (respects daily quota)
  5. Optimize images (WebP + thumbnails)
  6. Upload to Cloudflare R2
  7. Unflag successfully regenerated items via admin API
  8. Trigger Coolify deploy

Usage:
    python3 scripts/regen-flagged.py                  # full pipeline
    python3 scripts/regen-flagged.py --dry-run        # show what would happen
    python3 scripts/regen-flagged.py --queue-only     # just queue, don't generate
    python3 scripts/regen-flagged.py --status         # show current state

Requirements:
    pip install requests pillow pyyaml google-genai
"""

import argparse
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Auto-load .env
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
ROOT = SCRIPT_DIR.parent

def _load_dotenv(env_path: Path):
    if not env_path.exists():
        return
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

_load_dotenv(ROOT / ".env")
_load_dotenv(ROOT / ".env.claude")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

API_BASE = os.environ.get("COLOTOPIA_API_URL", "https://api.colotopia.com")
ADMIN_TOKEN = os.environ.get("COLOTOPIA_ADMIN_TOKEN", "")

COOLIFY_URL = os.environ.get("COOLIFY_URL", "http://51.77.67.123:8000")
COOLIFY_TOKEN = os.environ.get("COOLIFY_TOKEN", "")
COOLIFY_SITE_UUID = "bavjx37y7yerqhzd9qox22zn"
COOLIFY_API_UUID = "xcjjwbqri1vhy1i29r21qr6w"

CLOUDFLARE_R2_TOKEN = os.environ.get("CLOUDFLARE_R2_TOKEN", "")
CLOUDFLARE_ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")

QUEUE_FILE = ROOT / "data" / "generation-queue.json"
IMAGES_DIR = ROOT / "public" / "images" / "coloriages"

# Category prompt templates (fallback when no prior prompt exists)
CATEGORY_TEMPLATES = {
    'paques': "A cute Easter {subject}, simple cartoon line art style for kids, clean black outlines on white.",
    'noel': "A festive Christmas {subject}, simple cartoon line art style for kids, clean black outlines.",
    'halloween': "A Halloween {subject}, simple cartoon line art style for kids, clean black outlines.",
    'animaux': "A cute {subject}, simple cartoon line art style for kids, front view.",
    'animaux-marins': "A cute {subject}, simple cartoon line art style for kids, clean black outlines on white.",
    'insectes': "A cute {subject}, simple cartoon line art style for kids, clean black outlines on white.",
    'papillons': "A decorative {subject}, simple line art coloring page with clean black outlines.",
    'nature': "A peaceful {subject} nature scene, simple cartoon line art style for kids.",
    'fleurs': "Decorative {subject}, simple line art coloring page with clean black outlines.",
    'vitrail': "A stained glass window design of a {subject}, bold black outlines forming glass panels, coloring page.",
    'mosaiques': "A mosaic tile pattern of {subject}, bold black outlines, coloring page for adults.",
    'kawaii': "A kawaii-style cute {subject} with big smiling eyes, simple cartoon line art.",
    'metiers': "A smiling {subject} at work, simple cartoon line art style for kids.",
    'robots': "A friendly cartoon robot, a {subject}, simple line art style for kids.",
    'dinosaures': "A cartoon {subject} dinosaur, simple line art style for kids.",
    'vehicules': "A cartoon {subject}, side view, simple line art style for kids.",
    'saisons': "A {subject} seasonal scene, simple cartoon line art style for kids.",
    'sport': "A {subject}, simple cartoon line art style for kids, clean black outlines.",
    'espace': "A {subject} space scene, simple cartoon line art style for kids.",
    'lettres': "The letter {subject} decorated with cute patterns, simple line art for kids.",
    'licornes': "A magical unicorn {subject}, simple cartoon line art style for kids.",
    'drole': "A funny cartoon {subject}, playful line art style for kids.",
    'ferme': "A {subject} farm scene, simple cartoon line art style for kids.",
    'printemps': "A spring {subject} scene, simple cartoon line art style for kids.",
    'personnages': "A cute cartoon {subject}, simple line art style for kids.",
    'magie': "A magical {subject} scene, simple cartoon line art style for kids.",
    'culture': "A decorative {subject}, simple line art coloring page with clean black outlines.",
}

# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def api_get(path: str) -> dict:
    """GET request to the Colotopia admin API."""
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def api_post(path: str, body: dict) -> dict:
    """POST request to the Colotopia admin API."""
    url = f"{API_BASE}{path}"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


# ---------------------------------------------------------------------------
# Step 1: Fetch flagged items
# ---------------------------------------------------------------------------

def fetch_flagged_items() -> list[dict]:
    """Fetch flagged items from the admin API with both locale metadata."""
    # Try the new endpoint first
    try:
        data = api_get("/admin/colorings/flagged-for-regen")
        items = data.get("items", [])
        if items:
            print(f"[fetch] Got {len(items)} flagged items via /flagged-for-regen endpoint")
            return items
    except Exception as e:
        print(f"[fetch] /flagged-for-regen endpoint not available ({e}), falling back to manual fetch")

    # Fallback: fetch FR flagged items and try to find EN counterparts
    fr_data = api_get("/admin/colorings?flagged=true&limit=200&locale=fr")
    fr_items = fr_data.get("data", [])
    if not fr_items:
        print("[fetch] No flagged items found")
        return []

    # For each FR item, try to find the EN counterpart via content YAML
    result = []
    content_en_dir = ROOT / "src" / "content" / "coloriages" / "en"

    for fr in fr_items:
        image_path = fr["slug"]  # imagePath is the FR slug
        entry = {
            "imagePath": image_path,
            "flagReason": fr.get("flagReason"),
            "fr": {
                "id": fr["id"],
                "slug": fr["slug"],
                "title": fr["title"],
                "categorySlug": fr["category"],
                "audience": fr.get("audience", "enfants"),
                "tagsJson": [],
            },
            "en": None,
        }

        # Try to find EN YAML
        for yaml_file in content_en_dir.glob("*.yaml"):
            try:
                import yaml
                with open(yaml_file, encoding="utf-8") as f:
                    en_data = yaml.safe_load(f)
                if en_data and en_data.get("image") == image_path:
                    entry["en"] = {
                        "slug": en_data.get("slug", yaml_file.stem),
                        "title": en_data.get("title", ""),
                        "categorySlug": en_data.get("category", fr["category"]),
                        "audience": en_data.get("audience", "enfants"),
                        "tagsJson": en_data.get("tags", []),
                    }
                    break
            except Exception:
                continue

        result.append(entry)

    print(f"[fetch] Got {len(result)} flagged items (fallback mode)")
    return result


# ---------------------------------------------------------------------------
# Step 2: Queue for regeneration
# ---------------------------------------------------------------------------

def load_queue() -> dict:
    if QUEUE_FILE.exists():
        with open(QUEUE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"pending": [], "completed": [], "failed": [], "daily_counts": {}}


def save_queue(queue: dict):
    QUEUE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(QUEUE_FILE, "w", encoding="utf-8") as f:
        json.dump(queue, f, indent=2, ensure_ascii=False)


def queue_flagged_items(items: list[dict], dry_run: bool = False) -> list[dict]:
    """Add flagged items to the generation queue. Returns the list of queued entries."""
    queue = load_queue()

    # Build known prompts from history
    known = {}
    for key in ('completed', 'pending', 'failed'):
        for it in queue.get(key, []):
            known.setdefault(it.get('fr_slug', ''), it)

    entries = []
    deleted_files = 0

    for item in items:
        fr = item.get("fr")
        en = item.get("en")
        if not fr:
            continue

        image_path = item["imagePath"]
        fr_slug = fr["slug"]
        cat = fr["categorySlug"]

        # EN slug: from API data, or derive from fr_slug
        if en:
            en_slug = en["slug"]
            en_title = en.get("title", "")
            en_tags = en.get("tagsJson", [])
        else:
            # Fallback: use FR slug as EN slug (common pattern)
            en_slug = fr_slug
            en_title = fr.get("title", fr_slug.replace("-", " ").title())
            en_tags = []

        fr_title = fr.get("title", fr_slug.replace("-", " ").title())
        fr_tags = fr.get("tagsJson") or []

        # Find existing prompt or generate one
        prior = known.get(fr_slug)
        if prior and prior.get("prompt"):
            prompt = prior["prompt"]
        else:
            tpl = CATEGORY_TEMPLATES.get(cat, "A cute cartoon {subject}, simple line art style for kids, clean black outlines on white.")
            subj = en_title.lower() if en_title else fr_title.lower()
            prompt = tpl.format(subject=subj)

        entry = {
            "fr_slug": fr_slug,
            "en_slug": en_slug,
            "prompt": prompt,
            "category": cat,
            "fr_title": fr_title,
            "en_title": en_title,
            "fr_tags": list(fr_tags) if fr_tags else [],
            "en_tags": list(en_tags) if en_tags else [],
            "added_at": datetime.now(timezone.utc).isoformat(),
            "regen_reason": "flagged_in_admin",
            "flag_reason": item.get("flagReason", ""),
        }
        entries.append(entry)

        # Delete existing files so generator recreates them
        if not dry_run:
            for ext in ("png", "webp"):
                fp = IMAGES_DIR / f"{image_path}.{ext}"
                if fp.exists():
                    fp.unlink()
                    deleted_files += 1
            thumb_dir = IMAGES_DIR / "thumbs"
            for ext in ("png", "webp"):
                fp = thumb_dir / f"{image_path}.{ext}"
                if fp.exists():
                    fp.unlink()
                    deleted_files += 1

    if dry_run:
        print(f"[queue] Would queue {len(entries)} items for regeneration")
        for e in entries[:5]:
            print(f"  - {e['fr_slug']} ({e['category']}) — {e.get('flag_reason', '?')}")
        if len(entries) > 5:
            print(f"  ... and {len(entries) - 5} more")
        return entries

    # Remove these slugs from completed/failed/pending to avoid duplicates
    existing_slugs = {e["fr_slug"] for e in entries}
    queue["completed"] = [c for c in queue.get("completed", []) if c.get("fr_slug") not in existing_slugs]
    queue["failed"] = [f for f in queue.get("failed", []) if f.get("fr_slug") not in existing_slugs]
    queue["pending"] = [p for p in queue.get("pending", []) if p.get("fr_slug") not in existing_slugs]

    # Prepend to pending so flagged items run first
    queue["pending"] = entries + queue["pending"]
    save_queue(queue)

    print(f"[queue] Queued {len(entries)} flagged regenerations")
    print(f"[queue] Deleted {deleted_files} existing image files")
    print(f"[queue] Pending total: {len(queue['pending'])}")
    return entries


# ---------------------------------------------------------------------------
# Step 3: Run generation
# ---------------------------------------------------------------------------

def run_generation(dry_run: bool = False, backend: str = "gemini"):
    """Run the generation queue via the existing generate-coloriages.py script."""
    cmd = [
        sys.executable,
        str(SCRIPT_DIR / "generate-coloriages.py"),
        "--queue-run",
        "--backend", backend,
    ]
    if dry_run:
        cmd.append("--dry-run")

    print(f"\n[gen] Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(ROOT))
    return result.returncode == 0


# ---------------------------------------------------------------------------
# Step 4: Upload to R2
# ---------------------------------------------------------------------------

def upload_to_r2(entries: list[dict], dry_run: bool = False):
    """Upload regenerated images to Cloudflare R2."""
    if not CLOUDFLARE_R2_TOKEN or not CLOUDFLARE_ACCOUNT_ID:
        print("[r2] No R2 credentials — skipping upload")
        print("[r2] Set CLOUDFLARE_R2_TOKEN and CLOUDFLARE_ACCOUNT_ID in .env")
        return False

    bucket = "colotopia-images"
    api_base = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/r2/buckets/{bucket}/objects"

    uploaded = 0
    failed = 0

    for entry in entries:
        slug = entry["fr_slug"]
        # Upload PNG, WebP, and thumbnail
        files_to_upload = [
            (IMAGES_DIR / f"{slug}.png", f"coloriages/{slug}.png", "image/png"),
            (IMAGES_DIR / f"{slug}.webp", f"coloriages/{slug}.webp", "image/webp"),
            (IMAGES_DIR / "thumbs" / f"{slug}.webp", f"coloriages/thumbs/{slug}.webp", "image/webp"),
        ]

        for local_path, r2_key, content_type in files_to_upload:
            if not local_path.exists():
                continue

            if dry_run:
                print(f"  [r2 dry-run] Would upload: {r2_key}")
                continue

            try:
                with open(local_path, "rb") as f:
                    file_data = f.read()

                url = f"{api_base}/{r2_key}"
                req = urllib.request.Request(url, data=file_data, method="PUT", headers={
                    "Authorization": f"Bearer {CLOUDFLARE_R2_TOKEN}",
                    "Content-Type": content_type,
                })
                with urllib.request.urlopen(req, timeout=60) as resp:
                    if resp.status == 200:
                        uploaded += 1
                    else:
                        print(f"  [r2] Failed {r2_key}: HTTP {resp.status}")
                        failed += 1
            except Exception as e:
                print(f"  [r2] Error uploading {r2_key}: {e}")
                failed += 1

    print(f"[r2] Uploaded: {uploaded}, Failed: {failed}")
    return failed == 0


# ---------------------------------------------------------------------------
# Step 5: Unflag in database
# ---------------------------------------------------------------------------

def unflag_regenerated(entries: list[dict], dry_run: bool = False):
    """Unflag successfully regenerated items via the admin API."""
    # Only unflag items whose images were actually regenerated
    success_paths = []
    for entry in entries:
        slug = entry["fr_slug"]
        if (IMAGES_DIR / f"{slug}.png").exists():
            success_paths.append(slug)

    if not success_paths:
        print("[unflag] No successfully regenerated items to unflag")
        return

    if dry_run:
        print(f"[unflag] Would unflag {len(success_paths)} items")
        return

    try:
        result = api_post("/admin/colorings/unflag-batch", {"imagePaths": success_paths})
        print(f"[unflag] Unflagged {result.get('unflagged', 0)} rows")
    except Exception as e:
        print(f"[unflag] Batch unflag failed ({e}), trying individual unflag...")
        # Fallback: unflag one by one via the flag endpoint
        unflagged = 0
        for entry in entries:
            slug = entry["fr_slug"]
            if slug not in success_paths:
                continue
            # We need the item IDs — re-fetch from API
            try:
                data = api_get(f"/admin/colorings?flagged=true&limit=200")
                for item in data.get("data", []):
                    if item["slug"] == slug:
                        req = urllib.request.Request(
                            f"{API_BASE}/admin/colorings/{item['id']}/flag",
                            data=json.dumps({"flagged": False}).encode(),
                            method="PATCH",
                            headers={
                                "Authorization": f"Bearer {ADMIN_TOKEN}",
                                "Content-Type": "application/json",
                            }
                        )
                        urllib.request.urlopen(req, timeout=10)
                        unflagged += 1
                        break
            except Exception:
                pass
        print(f"[unflag] Individually unflagged {unflagged} items")


# ---------------------------------------------------------------------------
# Step 6: Trigger Coolify deploy
# ---------------------------------------------------------------------------

def trigger_deploy(dry_run: bool = False):
    """Trigger rebuild of both the Astro site and the API on Coolify."""
    if not COOLIFY_TOKEN:
        print("[deploy] No COOLIFY_TOKEN — skipping deploy")
        return

    if dry_run:
        print("[deploy] Would trigger Coolify deploy for site + API")
        return

    for label, uuid in [("Colotopia site", COOLIFY_SITE_UUID), ("Colotopia API", COOLIFY_API_UUID)]:
        url = f"{COOLIFY_URL}/api/v1/deploy?uuid={uuid}&force=true"
        req = urllib.request.Request(url, headers={
            "Authorization": f"Bearer {COOLIFY_TOKEN}",
            "Content-Type": "application/json",
        })
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8")
                print(f"[deploy] {label} rebuild triggered: {body}")
        except Exception as e:
            print(f"[deploy] Failed to trigger {label}: {e}")


# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------

def show_status():
    """Show current state of flagged items and queue."""
    # Flagged items
    try:
        fr_data = api_get("/admin/colorings?flagged=true&limit=200&locale=fr")
        flagged = fr_data.get("data", [])
        print(f"=== Flagged in DB: {len(flagged)} ===")
        reasons = {}
        for item in flagged:
            r = item.get("flagReason", "unknown")
            reasons[r] = reasons.get(r, 0) + 1
        for r, count in sorted(reasons.items(), key=lambda x: -x[1]):
            print(f"  {r}: {count}")
    except Exception as e:
        print(f"[status] Could not fetch flagged items: {e}")

    # Queue state
    queue = load_queue()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_count = queue.get("daily_counts", {}).get(today, 0)
    flagged_pending = [p for p in queue.get("pending", []) if p.get("regen_reason") == "flagged_in_admin"]

    print(f"\n=== Generation Queue ===")
    print(f"  Pending: {len(queue.get('pending', []))} ({len(flagged_pending)} flagged regens)")
    print(f"  Completed: {len(queue.get('completed', []))}")
    print(f"  Failed: {len(queue.get('failed', []))}")
    print(f"  Today's generations: {today_count}/70")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Automated regeneration of flagged coloring pages")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen without doing it")
    parser.add_argument("--queue-only", action="store_true", help="Only queue items, don't run generation")
    parser.add_argument("--status", action="store_true", help="Show current status")
    parser.add_argument("--backend", choices=["gemini", "openai"], default="gemini", help="Generation backend")
    parser.add_argument("--skip-upload", action="store_true", help="Skip R2 upload step")
    parser.add_argument("--skip-unflag", action="store_true", help="Skip unflagging step")
    parser.add_argument("--skip-deploy", action="store_true", help="Skip Coolify deploy step")
    args = parser.parse_args()

    if args.status:
        show_status()
        return

    print("=" * 60)
    print("  Colotopia — Flagged Image Regeneration Pipeline")
    print(f"  Mode: {'DRY RUN' if args.dry_run else 'EXECUTE'}")
    print(f"  Backend: {args.backend}")
    print(f"  Time: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    # Step 1: Fetch flagged items
    print("\n--- Step 1: Fetching flagged items ---")
    if not ADMIN_TOKEN:
        print("[error] COLOTOPIA_ADMIN_TOKEN not set. Add it to .env or set the env var.")
        sys.exit(1)

    items = fetch_flagged_items()
    if not items:
        print("[done] No flagged items to regenerate")
        return

    # Step 2: Queue them
    print("\n--- Step 2: Queuing for regeneration ---")
    entries = queue_flagged_items(items, dry_run=args.dry_run)

    if args.queue_only:
        print("\n[done] Queue-only mode — stopping here")
        return

    # Step 3: Run generation
    print("\n--- Step 3: Running image generation ---")
    gen_ok = run_generation(dry_run=args.dry_run, backend=args.backend)
    if not gen_ok and not args.dry_run:
        print("[warn] Generation had errors — continuing with available images")

    # Step 4: Upload to R2
    if not args.skip_upload:
        print("\n--- Step 4: Uploading to R2 ---")
        upload_to_r2(entries, dry_run=args.dry_run)
    else:
        print("\n--- Step 4: Skipping R2 upload ---")

    # Step 5: Unflag regenerated items
    if not args.skip_unflag:
        print("\n--- Step 5: Unflagging regenerated items ---")
        unflag_regenerated(entries, dry_run=args.dry_run)
    else:
        print("\n--- Step 5: Skipping unflag ---")

    # Step 6: Deploy
    if not args.skip_deploy:
        print("\n--- Step 6: Triggering deploy ---")
        trigger_deploy(dry_run=args.dry_run)
    else:
        print("\n--- Step 6: Skipping deploy ---")

    print("\n" + "=" * 60)
    print("  Pipeline complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
