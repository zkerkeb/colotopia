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

_BASE = (
    "IMPORTANT: absolutely no text, no words, no letters, no numbers, no captions, no labels anywhere. "
    "Children's coloring book thumbnail. Square format, white background. "
    "Warm and cozy illustration, thick clean black outlines, no color fills, no shading. "
    "Pure line art only, inviting and playful. Zero text of any kind."
)

CATEGORY_PROMPTS = {
    # --- kids ---
    "animaux": (
        "Children's coloring book thumbnail. Square format, white background. "
        "Warm and cozy illustration of cute cartoon animals — a fluffy cat, a happy dog, "
        "a chubby rabbit, and a little bird — snuggled together in a friendly group. "
        "Style: thick clean black outlines, no color fills, no shading, no text, no labels, "
        "no words anywhere in the image. Pure line art, coloring book for kids, inviting and playful."
    ),
    "animaux-marins": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "Cute sea creatures — a smiling fish, a round octopus, a starfish, and a crab — "
        "playfully arranged in a cozy underwater scene. "
        "Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "ferme": (
        f"{_BASE} "
        "Adorable farm animals — a cow, a pig, a chicken, and a sheep — "
        "gathered happily on a little farm, barn in background."
    ),
    "vehicules": (
        f"{_BASE} "
        "Cute cartoon vehicles — a rounded car, a smiling train, a chubby airplane, and a little boat — "
        "arranged in a cozy scene together."
    ),
    "nature": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "A cozy nature scene with a big leafy tree, cheerful flowers, a smiling sun, "
        "and a little butterfly, all snug together. "
        "Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "alphabet": (
        "IMPORTANT: absolutely no text, no words, no letters, no numbers anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "Cute art supplies for kids — colorful pencils, a paint brush, an eraser, and a ruler — "
        "arranged together warmly. Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "dinosaures": (
        f"{_BASE} "
        "Three adorable baby dinosaurs — a T-Rex, a Triceratops, and a long-neck Brachiosaurus — "
        "sitting together cozily."
    ),
    "super-heros": (
        f"{_BASE} "
        "A cute chubby superhero kid in a cape and mask, flying with a big smile, "
        "stars and sparkles around them."
    ),
    "espace": (
        f"{_BASE} "
        "A cozy space scene — a round rocket ship, a smiling planet with rings, "
        "a crescent moon, and little stars, all snuggled together."
    ),
    "princesses-chevaliers": (
        f"{_BASE} "
        "A cute princess in a puffy dress and a friendly knight in armor standing together "
        "in front of a little castle, warm and charming."
    ),
    "metiers": (
        f"{_BASE} "
        "Cute cartoon children dressed as different jobs — a doctor, a firefighter, a chef, "
        "and a builder — standing together cheerfully."
    ),
    "sport": (
        f"{_BASE} "
        "Fun sports equipment — a soccer ball, a tennis racket, a bicycle, and a jumping rope — "
        "arranged in a playful cozy composition."
    ),
    "saisons": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "Four cozy seasonal icons — a snowflake, a flower bud, a bright sun, and a falling leaf — "
        "arranged in four quadrants of the square, warm and cute. "
        "Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "fetes": (
        f"{_BASE} "
        "A festive celebration scene — balloons, a birthday cake with candles, confetti, "
        "and a gift box — cozy and joyful."
    ),
    "personnages": (
        f"{_BASE} "
        "Four cute cartoon character faces with round heads, big eyes, and friendly smiles, "
        "each with a different hat or hair style, arranged in a 2x2 grid, cheerful and warm."
    ),
    "contes": (
        f"{_BASE} "
        "A magical fairy-tale scene — a little fairy, a friendly dragon, a magic wand, "
        "and a tiny castle — warm and dreamy."
    ),
    "drole": (
        f"{_BASE} "
        "Funny cartoon faces and silly expressions — a goofy face, a laughing emoji, "
        "a clown nose, and a party hat — arranged in a playful grid."
    ),
    "musique": (
        "Children's coloring book thumbnail, square, white background. "
        "Four cute cartoon musical instruments: an acoustic guitar, a drum, a violin, and a xylophone, "
        "arranged together. Thick clean black outlines, no color fills, no shading. "
        "Do not include any musical notes, symbols, text, letters, or decorative floating elements. "
        "Only the physical instrument shapes, nothing else."
    ),
    "nourriture": (
        f"{_BASE} "
        "Cute cartoon foods — a slice of pizza, an ice cream cone, a cupcake, and an apple — "
        "smiling and arranged together warmly."
    ),
    "pirates": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "A friendly cartoon pirate with a hat, a little ship, a treasure chest, "
        "and a parrot — all cozy and fun. "
        "Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "robots": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "Three adorable boxy robots with big round eyes and antennae, "
        "waving and standing together in a cozy row. "
        "Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "kawaii": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "Cute kawaii-style icons — a chubby star with a face, a little cloud with eyes, "
        "a happy strawberry, and a tiny bow — grouped together sweetly. "
        "Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "licorne": (
        f"{_BASE} "
        "A cute chubby unicorn with a swirly horn, flowing mane, and stars around it, "
        "sitting happily in the center."
    ),
    "fleurs": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "A lush bouquet of cheerful flowers — roses, tulips, and daisies — "
        "with curly stems and big petals, warm and inviting. "
        "Thick clean black outlines, no color fills, no shading. Pure floral illustration."
    ),
    "chats": (
        f"{_BASE} "
        "Three adorable cats — one curled up, one stretching, one sitting with big eyes — "
        "snuggled together warmly."
    ),
    "papillons": (
        f"{_BASE} "
        "Three beautiful butterflies with patterned wings and curly antennae, "
        "fluttering together among tiny flowers."
    ),
    "bold-et-facile": (
        f"{_BASE} "
        "Simple bold shapes — a big sun, a round star, a heart, and a flower — "
        "drawn with very thick lines, easy and clear for young children."
    ),
    "paques": (
        f"{_BASE} "
        "Easter scene — a cute chick hatching from an egg, decorated Easter eggs, "
        "a little bunny, and spring flowers — cozy and sweet."
    ),
    "halloween": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "Cute Halloween icons — a friendly ghost, a little pumpkin, a small witch hat, "
        "and a crescent moon — spooky but adorable. "
        "Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "noel": (
        "IMPORTANT: absolutely no text, no words, no letters anywhere in this image. "
        "Children's coloring book thumbnail, square, white background. "
        "Cozy Christmas scene — a cute decorated Christmas tree, a little Santa hat, a candy cane, "
        "and a snowflake — warm and festive. "
        "Thick clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "champignons": (
        f"{_BASE} "
        "Cute cartoon mushrooms — tall ones, round ones, spotted ones — "
        "grouped together with tiny flowers and leaves, warm and whimsical."
    ),
    "religions": (
        f"{_BASE} "
        "Peaceful symbolic icons representing different faiths — a cross, a crescent moon and star, "
        "a Star of David, and a lotus — arranged harmoniously."
    ),
    # --- adults ---
    "cottagecore": (
        f"{_BASE} "
        "A cozy cottagecore scene — a mushroom cottage, wildflowers, a bee, "
        "and a little bird on a branch — romantic and whimsical line art."
    ),
    "vitrail": (
        f"{_BASE} "
        "A stained-glass style geometric rose window pattern — "
        "radiating shapes and petal forms, elegant and intricate line art."
    ),
    "zodiaque": (
        "IMPORTANT: absolutely no text, no words, no letters, no symbols anywhere in this image. "
        "Adult coloring book thumbnail, square, white background. "
        "A decorative circular frame with four illustrated zodiac creatures — a ram, a crab, a lion, and a scorpion — "
        "arranged elegantly around an ornate center rosette. "
        "Clean black outlines, no color fills, no shading. Pure illustration only."
    ),
    "affirmations": (
        "IMPORTANT: absolutely no text, no words, no letters, no numbers anywhere in this image. "
        "Adult coloring book thumbnail, square, white background. "
        "Decorative composition of hearts, stars, sun rays, and blooming flowers arranged symmetrically — "
        "uplifting and warm, purely visual. Thick clean black outlines, no color fills, no shading."
    ),
    "anti-stress": (
        "IMPORTANT: absolutely no text, no words, no letters, no numbers anywhere in this image. "
        "Adult coloring book thumbnail, square, white background. "
        "Calming zentangle-inspired illustration — flowing waves, gentle spirals, "
        "and soft leaf patterns filling the square entirely. Meditative and soothing. "
        "Thin elegant black outlines, no color fills, no shading. Pure abstract pattern."
    ),
    "mandalas": (
        f"{_BASE} "
        "A beautiful circular mandala with symmetrical petal and geometric patterns "
        "radiating from the center, elegant adult coloring book style."
    ),
    "mosaiques": (
        f"{_BASE} "
        "A geometric mosaic tile pattern — interlocking diamonds and hexagons "
        "in a symmetrical arrangement, elegant adult coloring book style."
    ),
    "abstrait": (
        f"{_BASE} "
        "An abstract composition of flowing organic shapes, bold curves, "
        "and geometric forms layered together, elegant adult coloring style."
    ),
    "cartes": (
        "IMPORTANT: absolutely no text, no words, no letters, no numbers anywhere in this image. "
        "Adult coloring book thumbnail, square, white background. "
        "A decorative map-inspired illustration — a large ornate compass rose at center, "
        "wavy sea lines, mountain peaks, and dotted paths — charming and detailed. "
        "Clean black outlines, no color fills, no shading, no labels of any kind."
    ),
    "paysages": (
        f"{_BASE} "
        "A serene landscape scene — rolling hills, a farmhouse, a winding river, "
        "and trees — calm and detailed adult coloring book style."
    ),
}

DEFAULT_PROMPT_TEMPLATE = (
    "Children's coloring book thumbnail. Square format, white background. "
    "Warm and cozy illustration representing the theme '{name}'. "
    "Style: thick clean black outlines, no color fills, no shading, no text, no labels, "
    "no words anywhere in the image. Pure line art, coloring book for kids, inviting and playful."
)

# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

GEMINI_IMAGEN_MODEL = "imagen-4.0-generate-001"
OPENAI_IMAGE_MODEL = "dall-e-3"
RATE_LIMIT_SECONDS = 7


def _get_prompt(category: str) -> str:
    label = category.replace("-", " ").title()
    return CATEGORY_PROMPTS.get(
        category,
        DEFAULT_PROMPT_TEMPLATE.format(name=category.replace("-", " "), label=label)
    )


def generate_icon_gemini(category: str, output_dir: Path) -> Path:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError:
        raise ImportError("google-genai package not installed. Run: pip install google-genai")

    client = genai.Client(api_key=api_key)
    prompt = _get_prompt(category)

    print(f"Generating icon for '{category}' (Gemini Imagen)...")
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


def generate_icon_openai(category: str, output_dir: Path) -> Path:
    import base64
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")

    try:
        from openai import OpenAI
    except ImportError:
        raise ImportError("openai package not installed. Run: pip install openai")

    client = OpenAI(api_key=api_key)
    prompt = _get_prompt(category)

    print(f"Generating icon for '{category}' (OpenAI DALL-E 3)...")
    print(f"  Prompt: {prompt[:80]}...")

    response = client.images.generate(
        model=OPENAI_IMAGE_MODEL,
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        response_format="b64_json",
        n=1,
    )

    image_bytes = base64.b64decode(response.data[0].b64_json)
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / f"{category}.png"
    out_path.write_bytes(image_bytes)
    print(f"  Saved: {out_path} ({len(image_bytes) // 1024}KB)")
    return out_path


def generate_icon(category: str, output_dir: Path, provider: str = "gemini") -> Path:
    if provider == "openai":
        return generate_icon_openai(category, output_dir)
    return generate_icon_gemini(category, output_dir)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate category icon images")
    parser.add_argument("category", nargs="?", help="Category key (e.g. animaux)")
    parser.add_argument("--all", action="store_true", help="Generate all categories with defined prompts")
    parser.add_argument("--provider", choices=["gemini", "openai"], default="gemini",
                        help="Image generation provider (default: gemini)")
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
            generate_icon(cat, output_dir, provider=args.provider)
        except Exception as e:
            print(f"  ERROR for '{cat}': {e}", file=sys.stderr)

    print(f"\nDone. Icons saved to {output_dir}")


if __name__ == "__main__":
    main()
