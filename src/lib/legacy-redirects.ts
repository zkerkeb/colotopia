import pageRedirects from '../data/page-redirects.json';
import imageAliases from '../data/legacy-image-aliases.json';

type Drawing = { slug: string; locale: string; image: string };
export function legacyRedirects(drawings: Drawing[], pageAliases: Record<string, string> = pageRedirects, legacyImages: Record<string, string> = imageAliases) {
  const pages = new Set(drawings.map(item => `/${item.locale}/${item.locale === 'fr' ? 'coloriage' : 'coloring'}/${item.slug}/`));
  const result: Record<string, string> = {};
  for (const [from, to] of Object.entries(pageAliases)) {
    if (!pages.has(to)) throw new Error(`Redirect has no published target: ${from} -> ${to}`);
    result[from] = to;
    result[from.slice(0, -1)] = to;
  }
  const keys = new Map<string, string>();
  for (const item of drawings) {
    const url = new URL(item.image);
    if (url.origin !== 'https://cdn.colotopia.com' || !/^\/coloriages\/[\w-]+\.png$/.test(url.pathname)) continue;
    const key = url.pathname.split('/').pop()!.replace(/\.png$/, '');
    for (const oldKey of [key, key.replace(/-r[0-9a-f]{12}$/, ''), item.slug]) {
      if (!/^[\w-]+$/.test(oldKey)) continue;
      if (keys.has(oldKey) && keys.get(oldKey) !== key) throw new Error(`Ambiguous legacy image key: ${oldKey}`);
      keys.set(oldKey, key);
    }
  }
  for (const [alias, key] of Object.entries(legacyImages)) if (keys.has(key)) keys.set(alias, keys.get(key)!);
  for (const [oldKey, key] of keys) {
    for (const extension of ['png', 'webp']) result[`/images/coloriages/${oldKey}.${extension}`] = `https://cdn.colotopia.com/coloriages/${key}.${extension}`;
    result[`/images/coloriages/thumbs/${oldKey}.webp`] = `https://cdn.colotopia.com/coloriages/thumbs/${key}.webp`;
  }
  return result;
}

export function nginxRedirectMap(redirects: Record<string, string>) {
  return '# Generated from the published catalog. Do not edit in production.\n' + Object.entries(redirects)
    .sort(([a], [b]) => a.localeCompare(b)).map(([from, to]) => `${JSON.stringify(from)} ${JSON.stringify(to)};`).join('\n') + '\n';
}
