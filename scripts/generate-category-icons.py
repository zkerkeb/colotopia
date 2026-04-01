#!/usr/bin/env python3
"""
Category icon image generator — coloring-page style.

Generates simple black-and-white line art thumbnails for category cards,
replacing the emoji icons with illustrated icons in a coloring-page aesthetic.

Usage:
    python3 scripts/generate-category-icons.py animaux
    python3 scripts/generate-category-icons.py --all

Requires: GEMINI_API_KEY in .env or environment.
Output: public/images/category-icons/{category}.png (512x512)
"""

import os
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Load .env
# ---------------------------------------------------------------------------

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

_load_dotenv(Path(__file__).parent.parent / ".env")

# ---------------------------------------------------------------------------
# Prompts per category
# ---------------------------------------------------------------------------

CATEGORY_PROMPTS = {
    "animaux": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: cute animals (cat, dog, rabbit, bird) in simple line art, children's coloring book style. "
        "Bottom 30%: bold playful text 'Animaux' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "animaux-marins": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: sea animals (fish, octopus, starfish) in simple line art, children's coloring book style. "
        "Bottom 30%: bold playful text 'Animaux Marins' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "ferme": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: farm animals (cow, pig, hen) in simple line art, children's coloring book style. "
        "Bottom 30%: bold playful text 'Ferme' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "vehicules": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: vehicles (car, train, airplane) in simple line art, children's coloring book style. "
        "Bottom 30%: bold playful text 'Véhicules' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "nature": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: nature scene (trees, flowers, sun) in simple line art, children's coloring book style. "
        "Bottom 30%: bold playful text 'Nature' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "dinosaures": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: cute dinosaurs in simple line art, children's coloring book style. "
        "Bottom 30%: bold playful text 'Dinosaures' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "fleurs": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: flowers (roses, tulips, daisies) in simple line art, coloring book style. "
        "Bottom 30%: bold playful text 'Fleurs' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "chats": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: cute cats in simple line art, children's coloring book style. "
        "Bottom 30%: bold playful text 'Chats' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "papillons": (
        "Square coloring page button image, white background, thick black outlines. "
        "Top 70%: butterflies in simple line art, coloring book style. "
        "Bottom 30%: bold playful text 'Papillons' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
    "mandalas": (
        "Square coloring page button image, white background, thin decorative outlines. "
        "Top 70%: mandala pattern in simple line art, adult coloring book style. "
        "Bottom 30%: bold elegant text 'Mandalas' centered in large friendly font, black letters on white. "
        "No color fills, no shading, clean minimal illustration."
    ),
}

DEFAULT_PROMPT_TEMPLATE = (
    "Square coloring page button image for the category '{name}', white background, thick black outlines. "
    "Top 70%: simple line art illustration representing the category, children's coloring book style. "
    "Bottom 30%: bold playful text '{label}' centered in large friendly font, black letters on white. "
    "No color fills, no shading, clean minimal illustration."
)

# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

GEMINI_IMAGEN_MODEL = "imagen-4.0-generate-001"
RATE_LIMIT_SECONDS = 7


def generate_icon(category: str, output_dir: Path) -> Path:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError:
        raise ImportError("google-genai package not installed. Run: pip install google-genai")

    client = genai.Client(api_key=api_key)

    label = category.replace("-", " ").title()
    prompt = CATEGORY_PROMPTS.get(
        category,
        DEFAULT_PROMPT_TEMPLATE.format(name=category.replace("-", " "), label=label)
    )

    print(f"Generating icon for '{category}'...")
    print(f"  Prompt: {prompt[:80]}...")

    response = client.models.generate_images(
        model=GEMINI_IMAGEN_MODEL,
        prompt=prompt,
        config=genai_types.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="1:1",
            output_mime_type="image/png",
            safety_filter_level="BLOCK_LOW_AND_ABOVE",
        ),
    )

    if not response.generated_images:
        raise RuntimeError(f"Imagen returned no images for '{category}' (possibly filtered)")

    image_bytes = response.generated_images[0].image.image_bytes

    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / f"{category}.png"
    out_path.write_bytes(image_bytes)
    print(f"  Saved: {out_path} ({len(image_bytes) // 1024}KB)")
    return out_path


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate category icon images")
    parser.add_argument("category", nargs="?", help="Category key (e.g. animaux)")
    parser.add_argument("--all", action="store_true", help="Generate all categories with defined prompts")
    args = parser.parse_args()

    output_dir = Path(__file__).parent.parent / "public" / "images" / "category-icons"

    if args.all:
        categories = list(CATEGORY_PROMPTS.keys())
    elif args.category:
        categories = [args.category]
    else:
        parser.print_help()
        sys.exit(1)

    for i, cat in enumerate(categories):
        if i > 0:
            time.sleep(RATE_LIMIT_SECONDS)
        try:
            generate_icon(cat, output_dir)
        except Exception as e:
            print(f"  ERROR for '{cat}': {e}", file=sys.stderr)

    print(f"\nDone. Icons saved to {output_dir}")


if __name__ == "__main__":
    main()
