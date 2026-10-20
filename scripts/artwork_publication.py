"""Fail-closed, versioned publication of an already reviewed coloring image."""
import hashlib
import re
import urllib.request
from pathlib import Path
from PIL import Image


def prepare_artwork(images_dir: Path, slug: str, previous_key: str) -> dict:
    if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]*", slug):
        raise ValueError("Invalid image slug")
    paths = {
        "png": images_dir / f"{slug}.png",
        "webp": images_dir / f"{slug}.webp",
        "thumbnail": images_dir / "thumbs" / f"{slug}.webp",
    }
    hashes = {}
    for kind, path in paths.items():
        with Image.open(path) as image:
            if image.format != ("PNG" if kind == "png" else "WEBP"):
                raise ValueError(f"Invalid {kind} format: {slug}")
            if min(image.size) < (100 if kind == "thumbnail" else 600):
                raise ValueError(f"Image too small: {slug}/{kind}")
            image.verify()
        hashes[kind] = hashlib.sha256(path.read_bytes()).hexdigest()
    key = f"{slug}-r{hashes['png'][:12]}"
    objects = {
        "png": f"coloriages/{key}.png",
        "webp": f"coloriages/{key}.webp",
        "thumbnail": f"coloriages/thumbs/{key}.webp",
    }
    return {
        "manifest": {"imagePath": previous_key, "replacementPath": key, "sha256": hashes},
        "files": [(paths[kind], objects[kind], "image/png" if kind == "png" else "image/webp", hashes[kind])
                  for kind in paths],
    }


def upload_artwork(artwork: dict, account: str, token: str, opener=urllib.request.urlopen) -> dict:
    if not account or not token:
        raise ValueError("R2 credentials required; publication cancelled")
    base = f"https://api.cloudflare.com/client/v4/accounts/{account}/r2/buckets/colotopia-images/objects"
    for path, object_key, content_type, checksum in artwork["files"]:
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != checksum:
            raise ValueError("Local artwork changed after review")
        request = urllib.request.Request(f"{base}/{object_key}", data=data, method="PUT", headers={
            "Authorization": f"Bearer {token}", "Content-Type": content_type,
        })
        with opener(request, timeout=60) as response:
            if response.status not in (200, 201):
                raise RuntimeError(f"Upload failed: {object_key}, HTTP {response.status}")
    # Verify public bytes, not just the storage service's acknowledgement.
    for _, object_key, _, checksum in artwork["files"]:
        request = urllib.request.Request(f"https://cdn.colotopia.com/{object_key}", headers={
            "User-Agent": "Colotopia-ArtworkVerifier/1.0",
        })
        with opener(request, timeout=30) as response:
            if response.status != 200 or hashlib.sha256(response.read()).hexdigest() != checksum:
                raise RuntimeError(f"CDN verification failed: {object_key}")
    return artwork["manifest"]
