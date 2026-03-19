# Image Generation Pipeline — Coloring Pages

Generates black-and-white A4 300dpi line art images for the coloring site using Google Gemini Imagen 4, and produces the matching Astro content collection YAML files.

## Setup

### 1. Install Python dependencies

```bash
pip install pillow pyyaml google-genai
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY
```

### 3. Verify setup with a dry run

```bash
python3 scripts/generate-coloriages.py --all --dry-run
```

## Usage

```bash
# Dry run — shows what would be generated, no API calls
python3 scripts/generate-coloriages.py --all --dry-run

# Generate all images in a category
python3 scripts/generate-coloriages.py --category animaux

# Generate first 5 subjects in a category
python3 scripts/generate-coloriages.py --category vehicules --count 5

# Generate all categories
python3 scripts/generate-coloriages.py --all

# Generate French content only
python3 scripts/generate-coloriages.py --category nature --locale fr

# Specify Astro root explicitly
ASTRO_ROOT=/path/to/coloriages python3 scripts/generate-coloriages.py --all
```

## What it generates

For each subject:
- **PNG image**: `public/images/coloriages/{fr-slug}.png` — A4 (2480×3508px), grayscale, 300dpi
- **FR YAML**: `src/content/coloriages/fr/{fr-slug}.yaml`
- **EN YAML**: `src/content/coloriages/en/{en-slug}.yaml`
- **Log**: `data/generation-logs/generation-{timestamp}.json`

## Prompt template

Each subject has a custom prompt in `scripts/coloriages-prompts.yaml`. The generation script appends a standard suffix ensuring the output is coloring-book style (thick black outlines, no shading, white background).

## Rate limiting

The script waits 2 seconds between API calls. Existing images are skipped (idempotent).

## Adding new subjects

Edit `scripts/coloriages-prompts.yaml`:

```yaml
categories:
  animaux:
    subjects:
      - fr_slug: animaux-tigre
        en_slug: animals-tiger
        fr_title: "Tigre puissant"
        en_title: "Powerful Tiger"
        fr_tags: ["tigre", "animaux", "savane"]
        en_tags: ["tiger", "animals", "savanna"]
        prompt: "A friendly cartoon tiger with stripes, sitting, simple cartoon style."
```

## Troubleshooting

**`GEMINI_API_KEY not set`** — copy `.env.example` to `.env` and add your key.

**`Cannot find Astro project root`** — set `ASTRO_ROOT=/absolute/path/to/coloriages`.

**`google-genai package not installed`** — run `pip install google-genai`.

**Image quality** — if line art is not clean enough, adjust the prompts in `coloriages-prompts.yaml`. Tip: prefix with "Black and white line art only," for stronger constraint.
