import tempfile
import unittest
import importlib.util
import contextlib
import io
from unittest.mock import patch
from pathlib import Path
from PIL import Image
from artwork_publication import prepare_artwork, upload_artwork

spec = importlib.util.spec_from_file_location("regen", Path(__file__).with_name("regen-flagged.py"))
regen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(regen)

class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / 'thumbs').mkdir()
        image = Image.new('RGB', (800, 1000), 'white')
        image.save(self.root / 'sample.png')
        image.save(self.root / 'sample.webp')
        image.resize((240, 300)).save(self.root / 'thumbs/sample.webp')
    def tearDown(self):
        self.temp.cleanup()
    def test_missing_variant_cannot_be_prepared(self):
        (self.root / 'thumbs/sample.webp').unlink()
        with self.assertRaises(FileNotFoundError): prepare_artwork(self.root, 'sample', 'old')
    def test_key_tracks_png_bytes(self):
        prepared = prepare_artwork(self.root, 'sample', 'old')
        self.assertEqual(prepared['manifest']['replacementPath'], 'sample-r' + prepared['manifest']['sha256']['png'][:12])
    def test_failed_upload_never_returns_publish_manifest(self):
        prepared = prepare_artwork(self.root, 'sample', 'old')
        def fail(*args, **kwargs): raise RuntimeError('Upload failed')
        with self.assertRaises(RuntimeError): upload_artwork(prepared, 'test', 'test', fail)
    def test_changed_file_cannot_be_uploaded(self):
        prepared = prepare_artwork(self.root, 'sample', 'old')
        (self.root / 'sample.png').write_bytes(b'changed')
        with self.assertRaises(ValueError): upload_artwork(prepared, 'test', 'test')
    def test_stale_cdn_blocks_publication(self):
        prepared = prepare_artwork(self.root, 'sample', 'old')
        class Response:
            status = 200
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'stale bytes'
        with self.assertRaisesRegex(RuntimeError, 'CDN verification'):
            upload_artwork(prepared, 'test', 'test', lambda *args, **kwargs: Response())

class PipelineTests(unittest.TestCase):
    def run_pipeline(self, arguments=(), generation=True, upload_error=None):
        with patch.object(regen, "ADMIN_TOKEN", "test"), \
             patch.object(regen.sys, "argv", ["regen-flagged.py", *arguments]), \
             patch.object(regen, "fetch_flagged_items", return_value=[{}]), \
             patch.object(regen, "queue_flagged_items", return_value=[{}]), \
             patch.object(regen, "run_generation", return_value=generation), \
             patch.object(regen, "upload_to_r2", side_effect=upload_error, return_value=[]) as upload, \
             patch.object(regen, "unflag_regenerated") as publish, \
             patch.object(regen, "trigger_deploy") as deploy, \
             contextlib.redirect_stdout(io.StringIO()):
            if not generation or upload_error:
                with self.assertRaises(RuntimeError): regen.main()
            else:
                regen.main()
            publish.assert_not_called()
            deploy.assert_not_called()
            if not generation or "--skip-upload" in arguments: upload.assert_not_called()
    def test_upload_failure_preserves_flags(self):
        self.run_pipeline(upload_error=RuntimeError("network error"))
    def test_generation_failure_preserves_flags(self):
        self.run_pipeline(generation=False)
    def test_skipping_upload_cannot_unflag(self):
        self.run_pipeline(arguments=("--skip-upload",))
    def test_old_local_success_cannot_be_republished(self):
        with patch.object(regen, "load_queue", return_value={"completed": [{"fr_slug": "sample", "completed_at": "2026-01-01"}]}), \
             patch.object(regen, "prepare_artwork") as prepare:
            self.assertEqual(regen.upload_to_r2([{"fr_slug": "sample", "added_at": "2026-10-20"}]), [])
            prepare.assert_not_called()
    def test_successful_generation_still_requires_visual_review(self):
        with tempfile.TemporaryDirectory() as folder, \
             patch.object(regen, "ROOT", Path(folder)), \
             patch.object(regen, "ADMIN_TOKEN", "test"), \
             patch.object(regen.sys, "argv", ["regen-flagged.py"]), \
             patch.object(regen, "fetch_flagged_items", return_value=[{}]), \
             patch.object(regen, "queue_flagged_items", return_value=[{}]), \
             patch.object(regen, "run_generation", return_value=True), \
             patch.object(regen, "upload_to_r2", return_value=[{"imagePath": "sample"}]), \
             patch.object(regen, "unflag_regenerated") as publish, \
             contextlib.redirect_stdout(io.StringIO()):
            regen.main()
            publish.assert_not_called()
            manifests = list((Path(folder) / "data/artwork-reviews").glob("*.json"))
            self.assertEqual(len(manifests), 1)
            self.assertFalse(regen.json.loads(manifests[0].read_text())["reviewed"])

if __name__ == '__main__': unittest.main()
