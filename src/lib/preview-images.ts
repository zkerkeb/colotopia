import { getImage, inferRemoteSize } from 'astro:assets';
import { toWebp } from './cdn';

const dimensions = new Map<string, ReturnType<typeof inferRemoteSize>>();
const previews = new Map<string, Promise<{ src: string; srcset: string; width: number; height: number }>>();

/** Print masters stay on the CDN; these fingerprinted files are screen previews. */
export function coloringPreview(image: string, kind: 'card' | 'page' | 'hero' = 'card') {
  const source = toWebp(image), key = `${source}:${kind}`;
  if (!previews.has(key)) previews.set(key, (async () => {
    if (!dimensions.has(source)) dimensions.set(source, inferRemoteSize(source));
    const original = await dimensions.get(source)!;
    const requested = kind === 'page' ? [480, 960, 1440] : kind === 'hero' ? [120, 240, 360] : [240, 480, 720];
    const widths = [...new Set(requested.map(width => Math.min(width, original.width)))];
    const images = await Promise.all(widths.map(width => getImage({
      src: source, width, height: Math.round(width * original.height / original.width), format: 'webp', quality: 90,
    })));
    const preferred = images[Math.min(1, images.length - 1)];
    return { src: preferred.src, srcset: images.map((item, i) => `${item.src} ${widths[i]}w`).join(', '), width: original.width, height: original.height };
  })());
  return previews.get(key)!;
}
