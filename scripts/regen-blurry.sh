#!/bin/bash
# Regenerate the 53 blurriest OpenAI-generated images using Gemini.
#
# Strategy:
#   1. Delete the existing PNGs (so queue-add will detect them as missing)
#   2. Run queue-add to re-queue them
#   3. Run queue-run --backend gemini to regenerate (respects 70/day quota)
#
# Usage:
#   chmod +x scripts/regen-blurry.sh
#   cd /path/to/coloriages
#   ./scripts/regen-blurry.sh              # dry-run (just shows what will happen)
#   ./scripts/regen-blurry.sh --execute    # actually delete + re-queue + regenerate

set -euo pipefail

IMAGES_DIR="public/images/coloriages"
DRY_RUN=true

if [[ "${1:-}" == "--execute" ]]; then
  DRY_RUN=false
fi

# The 53 worst OpenAI images (mid% > 8%, meaning significant shading/blur)
SLUGS=(
  affirmations-arc-en-ciel
  affirmations-cadre-floral-1
  affirmations-cercle-nature
  affirmations-lune-etoiles
  affirmations-mandala-coeur
  affirmations-montagnes-soleil
  affirmations-papillon-fleurs
  affirmations-plume-botanique
  affirmations-soleil-rayons
  anti-stress-automne
  anti-stress-foret
  anti-stress-koi
  anti-stress-lune-botanique
  anti-stress-mandala-nature
  anti-stress-paisley
  anti-stress-plumes
  anti-stress-tortue
  anti-stress-vagues-ocean
  champignons-spirale-decoratif
  cottagecore-champignon-maison
  cottagecore-chat-panier
  cottagecore-chaumiere
  cottagecore-cuisine-rustique
  cottagecore-lanterne
  cottagecore-livre-jardin
  cottagecore-prairie-wildflowers
  cottagecore-ruche
  cottagecore-tasse-the
  cottagecore-theiere
  fleurs-jardin
  halloween-village-hante
  noel-flocon-neige
  noel-hiver-village
  paques-papillon-oeufs
  paysages-santorin
  vitrail-arbre-vie
  vitrail-fleurs-geometriques
  vitrail-lune-etoiles
  vitrail-paon-plumes
  vitrail-poisson-eau
  vitrail-rosace-cathedrale
  zodiaque-balance
  zodiaque-belier
  zodiaque-cancer
  zodiaque-capricorne
  zodiaque-gemeaux
  zodiaque-lion
  zodiaque-poissons
  zodiaque-sagittaire
  zodiaque-scorpion
  zodiaque-taureau
  zodiaque-verseau
  zodiaque-vierge
)

echo "=== Colotopia: Regenerate ${#SLUGS[@]} blurry images ==="
echo "Mode: $(if $DRY_RUN; then echo 'DRY RUN (pass --execute to apply)'; else echo 'EXECUTE'; fi)"
echo ""

DELETED=0
MISSING=0

for slug in "${SLUGS[@]}"; do
  png="${IMAGES_DIR}/${slug}.png"
  if [[ -f "$png" ]]; then
    if $DRY_RUN; then
      echo "[dry-run] Would delete: $png"
    else
      rm "$png"
      echo "[deleted] $png"
    fi
    ((DELETED++)) || true
  else
    echo "[skip] $png (already missing)"
    ((MISSING++)) || true
  fi
done

echo ""
echo "Deleted: $DELETED  |  Already missing: $MISSING"
echo ""

if ! $DRY_RUN; then
  echo "=== Re-queuing missing images ==="
  python3 scripts/generate-coloriages.py --queue-add
  echo ""
  echo "=== Processing queue with Gemini ==="
  python3 scripts/generate-coloriages.py --queue-run --backend gemini
  echo ""
  echo "=== Running image optimization ==="
  node scripts/optimize-images.mjs
fi

echo ""
echo "Done! If daily quota was reached, remaining images will be processed"
echo "by the next daily generation run (now full Gemini)."
