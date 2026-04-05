#!/bin/bash
# Upload all images to Cloudflare R2 bucket
# Usage: CLOUDFLARE_R2_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=xxx ./scripts/upload-r2.sh

set -euo pipefail

CF_TOKEN="${CLOUDFLARE_R2_TOKEN}"
CF_ACCOUNT="${CLOUDFLARE_ACCOUNT_ID}"
BUCKET="colotopia-images"
IMAGES_DIR="/Users/hikkary/paperclip/coloriages/public/images"
API_BASE="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/r2/buckets/${BUCKET}/objects"

TOTAL=0
SUCCESS=0
FAILED=0
SKIPPED=0

get_content_type() {
  case "$1" in
    *.png) echo "image/png" ;;
    *.webp) echo "image/webp" ;;
    *.svg) echo "image/svg+xml" ;;
    *.jpg|*.jpeg) echo "image/jpeg" ;;
    *) echo "application/octet-stream" ;;
  esac
}

upload_file() {
  local file="$1"
  local key="${file#$IMAGES_DIR/}"
  local content_type
  content_type=$(get_content_type "$file")

  local response
  response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Authorization: Bearer ${CF_TOKEN}" \
    -H "Content-Type: ${content_type}" \
    --data-binary @"${file}" \
    "${API_BASE}/${key}" 2>/dev/null)

  local http_code
  http_code=$(echo "$response" | tail -1)

  if [ "$http_code" = "200" ]; then
    return 0
  else
    echo "FAIL: ${key} (HTTP ${http_code})" >&2
    return 1
  fi
}

echo "Scanning ${IMAGES_DIR}..."
files=()
while IFS= read -r -d '' file; do
  files+=("$file")
done < <(find "$IMAGES_DIR" -type f \( -name "*.png" -o -name "*.webp" -o -name "*.svg" -o -name "*.jpg" \) -print0)

TOTAL=${#files[@]}
echo "Found ${TOTAL} files to upload"
echo ""

# Upload with concurrency (8 parallel)
PARALLEL=8
BATCH=0

for file in "${files[@]}"; do
  ((BATCH++)) || true
  key="${file#$IMAGES_DIR/}"

  (
    if upload_file "$file"; then
      echo "OK: ${key}"
    fi
  ) &

  if (( BATCH % PARALLEL == 0 )); then
    wait
    echo "--- Progress: ${BATCH}/${TOTAL} ---"
  fi
done

wait
echo ""
echo "Upload complete: ${TOTAL} files processed"
