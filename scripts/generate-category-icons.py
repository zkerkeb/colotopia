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
        "Simple black and white coloring page icon of cute animals, "
        "clean line art drawing, featuring a cat, a dog, a rabbit and a bird "
        "arranged in a square composition, white background, thick outlines, "
        "no color fills, no text, no shading, suitable as a small thumbnail icon, "
        "children's coloring book style, minimal and charming"
    ),
    "animaux-marins": (
        "Simple black and white coloring page icon, clean line art drawing of "
        "sea animals: fish, octopus, starfish arranged in a square composition, "
        "white background, thick outlines, no color, children's coloring book style"
    ),
    "ferme": (
        "Simple black and white coloring page icon, clean line art of farm animals: "
        "cow, pig, hen arranged in a square composition, white background, thick outlines, "
        "no color, children's coloring book style"
    ),
    "vehicules": (
        "Simple black and white coloring page icon, clean line art of vehicles: "
        "car, train, airplane arranged in a square composition, white background, "
        "thick outlines, no color, children's coloring book style"
    ),
    "nature": (
        "Simple black and white coloring page icon, clean line art of nature: "
        "trees, flowers, sun arranged in a square composition, white background, "
        "thick outlines, no color, children's coloring book style"
    ),
    "dinosaures": (
        "Simple black and white coloring page icon, clean line art of cute dinosaurs "
        "arranged in a square composition, white background, thick outlines, no color, "
        "children's coloring book style"
    ),
    "fleurs": (
        "Simple black and white coloring page icon, clean line art of flowers "
        "arranged in a square composition, white background, thick outlines, no color, "
        "coloring book style"
    ),
    "chats": (
        "Simple black and white coloring page icon, clean line art of cute cats "
        "arranged in a square composition, white background, thick outlines, no color, "
        "children's coloring book style"
    ),
    "papillons": (
        "Simple black and white coloring page icon, clean line art of butterflies "
        "arranged in a square composition, white background, thick outlines, no color, "
        "coloring book style"
    ),
    "mandalas": (
        "Simple black and white coloring page icon, clean line art mandala pattern "
        "in a square composition, white background, thin decorative outlines, no color, "
        "adult coloring book style"
    ),
}

DEFAULT_PROMPT_TEMPLATE = (
    "Simple black and white coloring page icon for the category '{name}', "
    "clean line art drawing in a square composition, white background, "
    "thick outlines, no color fills, no text, children's coloring book style, "
    "minimal and charming"
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

    prompt = CATEGORY_PROMPTS.get(
        category,
        DEFAULT_PROMPT_TEMPLATE.format(name=category.replace("-", " "))
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
