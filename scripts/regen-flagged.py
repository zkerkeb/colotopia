#!/usr/bin/env python3
"""
Automated regeneration of flagged coloring pages.

Full pipeline:
  1. Fetch flagged items from the Colotopia admin API (both FR+EN metadata)
  2. Queue them in generation-queue.json (prepended for priority)
  3. Back up local PNG/WebP before generating replacements
  4. Run generation via Gemini Imagen 4 (respects daily quota)
  5. Optimize images (WebP + thumbnails)
  6. Upload to Cloudflare R2
  7. Save a manifest for visual review; keep the existing flags
  8. After review, --publish-manifest atomically updates every locale and rebuilds the site

Usage:
    python3 scripts/regen-flagged.py                  # full pipeline
    python3 scripts/regen-flagged.py --dry-run        # show what would happen
    python3 scripts/regen-flagged.py --queue-only     # just queue, don't generate
    python3 scripts/regen-flagged.py --status         # show current state
    python3 scripts/regen-flagged.py --publish-manifest data/artwork-reviews/approved.json

Requirements:
    pip install requests pillow pyyaml google-genai
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import shutil
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path
from artwork_publication import prepare_artwork, upload_artwork

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

GEMINI_TEXT_MODEL = os.environ.get("GEMINI_TEXT_MODEL", "gemini-2.5-flash")

# ---------------------------------------------------------------------------
# Prompt rewriting via Gemini text (addresses flag_reason)
# ---------------------------------------------------------------------------

_GEMINI_TEXT_CLIENT = None

def _get_gemini_text_client():
    """Lazy-init a google-genai client for text. Returns None if key missing."""
    global _GEMINI_TEXT_CLIENT
    if _GEMINI_TEXT_CLIENT is not None:
        return _GEMINI_TEXT_CLIENT
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
    except ImportError:
        print("[rewrite] google-genai not installed — skipping prompt rewrite")
        return None
    _GEMINI_TEXT_CLIENT = genai.Client(api_key=api_key)
    return _GEMINI_TEXT_CLIENT


def rewrite_prompt_with_gemini(
    fr_title: str,
    en_title: str,
    category: str,
    old_prompt: str,
    flag_reason: str,
) -> str | None:
    """
    Ask Gemini text to produce a NEW image prompt that addresses the flag_reason.
    Returns the new prompt string, or None if anything fails (caller should fall back).
    """
    client = _get_gemini_text_client()
    if client is None:
        return None

    subject = en_title or fr_title or category
    flag_reason = (flag_reason or "").strip() or "image quality not good enough for a kids coloring page"

    meta = f"""You are a prompt engineer for an AI image generator (Google Imagen 4) producing kids' coloring pages.

A previous coloring page was REJECTED by the editor and must be regenerated. Your job: write ONE new improved image prompt that explicitly fixes the rejection issue.

Subject: {subject}
Category: {category}
Previous prompt: {old_prompt or "<none>"}
Rejection reason: {flag_reason}

Hard requirements for the new prompt:
- Black line art only, clean bold outlines on plain white background
- Simple, kid-friendly cartoon style, no shading, no gradients, no color, no fill
- No text, no letters, no watermark, no border
- Front view or simple composition, large fillable areas suitable for coloring
- Address the rejection reason directly (e.g. if "too complex", make it dramatically simpler; if "off-topic", refocus on the subject; if "scary", make it cute and friendly)

Output ONLY the new prompt as ONE short English sentence (max ~30 words). No preamble, no quotes, no markdown, no explanation."""

    try:
        resp = client.models.generate_content(
            model=GEMINI_TEXT_MODEL,
            contents=meta,
        )
        text = (getattr(resp, "text", None) or "").strip()
        # Strip accidental quotes / code fences / leading bullets
        text = text.strip("`").strip().strip('"').strip("'").lstrip("-•* ").strip()
        # Take first non-empty line only
        for line in text.splitlines():
            line = line.strip()
            if line:
                text = line
                break
        if len(text) < 10 or len(text) > 600:
            return None
        return text
    except Exception as e:
        print(f"[rewrite] Gemini text rewrite failed: {e}")
        return None


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def api_get(path: str) -> dict:
    """GET request to the Colotopia admin API."""
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json",
        "User-Agent": "Colotopia-RegenScript/1.0",
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
        "User-Agent": "Colotopia-RegenScript/1.0",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


# ---------------------------------------------------------------------------
# Step 1: Fetch flagged items
# ---------------------------------------------------------------------------

def fetch_flagged_items() -> list[dict]:
    """Fetch flagged items from the admin API with both locale metadata."""
    data = api_get("/admin/colorings/flagged-for-regen")
    items = data.get("items")
    if not isinstance(items, list) or data.get("count") != len(items):
        raise RuntimeError("Invalid flagged catalog response; generation cancelled")
    print(f"[fetch] Got {len(items)} flagged artworks with their current shared keys")
    return items


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
    archived_files = 0
    backup_dir = ROOT / "data" / "artwork-backups" / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")

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
        old_prompt = prior.get("prompt") if prior else ""
        flag_reason = (item.get("flagReason") or "").strip()

        if flag_reason and not dry_run:
            # Ask Gemini to rewrite the prompt addressing the flag_reason.
            # If rewrite fails, fall back to old behavior so we don't block.
            rewritten = rewrite_prompt_with_gemini(
                fr_title=fr_title,
                en_title=en_title,
                category=cat,
                old_prompt=old_prompt,
                flag_reason=flag_reason,
            )
            if rewritten:
                prompt = rewritten
                print(f"[rewrite] {fr_slug}: '{flag_reason}' → new prompt: {prompt[:80]}...")
            elif old_prompt:
                prompt = old_prompt
                print(f"[rewrite] {fr_slug}: rewrite failed, reusing prior prompt")
            else:
                tpl = CATEGORY_TEMPLATES.get(cat, "A cute cartoon {subject}, simple line art style for kids, clean black outlines on white.")
                subj = en_title.lower() if en_title else fr_title.lower()
                prompt = tpl.format(subject=subj)
        elif old_prompt:
            prompt = old_prompt
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
            "previous_image_path": image_path,
            "flag_reason": item.get("flagReason", ""),
        }
        entries.append(entry)

        # Keep rollback originals. The generator writes under the FR slug even
        # when the current published image has a versioned key.
        if not dry_run:
            for relative in (f"{fr_slug}.png", f"{fr_slug}.webp", f"thumbs/{fr_slug}.webp"):
                source = IMAGES_DIR / relative
                if source.exists():
                    target = backup_dir / relative
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(source), str(target))
                    archived_files += 1

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
    print(f"[queue] Archived {archived_files} existing image files for rollback")
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
    """Only fresh successful queue entries can be published; never infer success from a file."""
    completed = {item["fr_slug"]: item for item in load_queue().get("completed", [])}
    manifests = []
    for entry in entries:
        result = completed.get(entry["fr_slug"])
        if not dry_run and (not result or result.get("completed_reason") == "image already existed"
                            or result.get("completed_at", "") < entry["added_at"]):
            continue
        if dry_run:
            print(f"[publish dry-run] Would verify and publish {entry['fr_slug']}")
            continue
        artwork = prepare_artwork(IMAGES_DIR, entry["fr_slug"], entry["previous_image_path"])
        manifests.append(upload_artwork(artwork, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_TOKEN))
    return manifests


def unflag_regenerated(manifests: list[dict], dry_run: bool = False):
    """Publication swaps the image and clears flags together, after CDN checks."""
    if dry_run or not manifests:
        return 0
    published = 0
    for index in range(0, len(manifests), 5):
        result = api_post("/admin/colorings/publish-regenerated", {"replacements": manifests[index:index + 5]})
        published += result.get("published", 0)
    print(f"[publish] Published {published} locale rows with verified replacement images")
    return published


# ---------------------------------------------------------------------------
# Step 6: Trigger Coolify deploy
# ---------------------------------------------------------------------------

def trigger_deploy(dry_run: bool = False):
    """Rebuild the static website after a successful catalog publication."""
    if not COOLIFY_TOKEN:
        raise RuntimeError("Catalog published, but COOLIFY_TOKEN is missing: rebuild the website before reporting completion")

    if dry_run:
        print("[deploy] Would trigger Coolify deploy for the website")
        return

    for label, uuid in [("Colotopia site", COOLIFY_SITE_UUID)]:
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
            raise RuntimeError(f"Catalog published, but the website rebuild failed: {type(e).__name__}") from e


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
    print(f"  Today's generations: {today_count}")


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
    parser.add_argument("--publish-manifest", type=Path, help="Publish a visually reviewed manifest instead of generating")
    args = parser.parse_args()

    if args.status:
        show_status()
        return
    if args.publish_manifest:
        manifest = json.loads(args.publish_manifest.read_text())
        if manifest.get("reviewed") is not True or not manifest.get("replacements"):
            raise RuntimeError("Visual review is required before publishing replacement artwork")
        if args.dry_run:
            print(f"[publish dry-run] {len(manifest['replacements'])} reviewed replacements")
            return
        published = unflag_regenerated(manifest["replacements"])
        if published and not args.skip_deploy:
            trigger_deploy()
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
        raise RuntimeError("Generation failed; publication cancelled and flags preserved")

    # An upload failure must never fall through into unflagging.
    manifests = []
    if not args.skip_upload:
        manifests = upload_to_r2(entries, dry_run=args.dry_run)
    if manifests:
        review_dir = ROOT / "data" / "artwork-reviews"
        review_dir.mkdir(parents=True, exist_ok=True)
        review_path = review_dir / f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')}.json"
        review_path.write_text(json.dumps({
            "reviewed": False,
            "replacements": manifests,
        }, indent=2))
        print(f"[review] Inspect every replacement, then set reviewed=true in an approved manifest: {review_path}")
        print("[review] Publish it with --publish-manifest; rejected drawings must stay flagged")
    print("[publish] No catalog changes; existing flags were preserved")

    print("\n" + "=" * 60)
    print("  Pipeline complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
