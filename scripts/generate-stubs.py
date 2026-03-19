#!/usr/bin/env python3
"""
Generate Astro content YAML stubs for subjects that don't have content files yet.
Uses the same logic as generate-coloriages.py but skips image generation.
Creates placeholder content files with image paths that don't exist yet.

Usage:
    python3 scripts/generate-stubs.py
    python3 scripts/generate-stubs.py --category personnages
    python3 scripts/generate-stubs.py --only-missing
"""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

SCRIPT_DIR = Path(__file__).parent
PROMPTS_FILE = SCRIPT_DIR / "coloriages-prompts.yaml"

ADULT_CATEGORIES = {"mandalas", "mosaiques", "abstrait", "cartes", "paysages"}


def get_astro_root() -> Path:
    candidate = SCRIPT_DIR.parent
    for _ in range(5):
        if (candidate / "astro.config.mjs").exists():
            return candidate
        candidate = candidate.parent
    raise RuntimeError("Cannot find Astro project root.")


def make_content_yaml(subject: dict, locale: str, category: str) -> dict:
    is_fr = locale == "fr"
    slug_key = "fr_slug" if is_fr else "en_slug"
    title_key = "fr_title" if is_fr else "en_title"
    tags_key = "fr_tags" if is_fr else "en_tags"

    slug = subject[slug_key]
    title = subject[title_key]
    tags = subject.get(tags_key, [])
    audience = "adultes" if category in ADULT_CATEGORIES else "enfants"
    image_slug = subject["fr_slug"]  # image always uses fr_slug

    if is_fr:
        alt = f"Coloriage {title.lower()} a imprimer, dessin au trait simple"
        seo_title = f"Coloriage {title} a imprimer gratuitement | Coloriages"
        seo_desc = (
            f"Telecharge et imprime gratuitement ce coloriage de {title.lower()}. "
            "Parfait pour les enfants de 3 a 8 ans. Format A4, haute qualite."
        )
    else:
        alt = f"Coloring page of {title.lower()}, simple line drawing"
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


def run(args):
    with open(PROMPTS_FILE, encoding="utf-8") as f:
        config = yaml.safe_load(f)

    categories = config["categories"]
    astro_root = get_astro_root()

    if args.category:
        if args.category not in categories:
            print(f"Unknown category '{args.category}'. Available: {list(categories.keys())}", file=sys.stderr)
            sys.exit(1)
        selected = [args.category]
    else:
        selected = list(categories.keys())

    created = 0
    skipped = 0

    for cat_name in selected:
        subjects = categories[cat_name]["subjects"]
        print(f"\n=== {cat_name} ({len(subjects)} subjects) ===")

        for subject in subjects:
            subject["category"] = cat_name
            fr_slug = subject["fr_slug"]
            en_slug = subject["en_slug"]

            for locale, slug in [("fr", fr_slug), ("en", en_slug)]:
                content_dir = astro_root / "src" / "content" / "coloriages" / locale
                content_dir.mkdir(parents=True, exist_ok=True)
                out_path = content_dir / f"{slug}.yaml"

                if out_path.exists() and args.only_missing:
                    skipped += 1
                    continue

                if out_path.exists() and not args.force:
                    print(f"  [skip] {locale}/{slug}.yaml (already exists)")
                    skipped += 1
                    continue

                content = make_content_yaml(subject, locale, cat_name)
                with open(out_path, "w", encoding="utf-8") as f:
                    yaml.dump(content, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
                print(f"  [ok  ] {locale}/{slug}.yaml")
                created += 1

    print(f"\nDone: {created} created, {skipped} skipped.")


def main():
    parser = argparse.ArgumentParser(description="Generate content YAML stubs without images.")
    parser.add_argument("--category", help="Process only this category")
    parser.add_argument("--only-missing", action="store_true", help="Only create files that don't exist yet")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()
    run(args)


if __name__ == "__main__":
    main()
