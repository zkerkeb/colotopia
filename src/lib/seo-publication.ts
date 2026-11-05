import { readdir, writeFile } from 'node:fs/promises';
import { getPublishableColoriages } from './coloriages';
import { legacyRedirects, nginxRedirectMap } from './legacy-redirects';
import newCollection from '../data/shop-collection-2026-11.json';
import { shopPath } from './shop';

const lastModified = new Map<string, string>([
  ["https://colotopia.com/fr/coloriage-en-ligne/", "2026-11-02"],
  ["https://colotopia.com/en/online-coloring/", "2026-11-02"],
  ["https://colotopia.com/fr/boutique/", "2026-11-05"],
  ["https://colotopia.com/en/shop/", "2026-11-05"],
  ["https://colotopia.com/fr/blog/calendrier-avent-activites-enfants/", "2026-11-05"],
  ["https://colotopia.com/fr/blog/jeux-enfants-restaurant-imprimer/", "2026-11-05"],
]);
for (const book of newCollection) for (const locale of ['fr', 'en'] as const) {
  lastModified.set(`https://colotopia.com${shopPath(locale)}${book.slugs[locale]}/`, '2026-11-05');
}
export async function initSeoPublication() {
  const pages = (await Promise.all([getPublishableColoriages('fr'), getPublishableColoriages('en')])).flat();
  for (const { data } of pages) if (data.updatedAt) lastModified.set(`https://colotopia.com/${data.locale}/${data.locale === 'fr' ? 'coloriage' : 'coloring'}/${data.slug}/`, data.updatedAt);
}
export function getLastModified(url: string) { return lastModified.get(url); }
export async function writePublicationArtifacts(dir: URL) {
  const pages = (await Promise.all([getPublishableColoriages('fr'), getPublishableColoriages('en')])).flat();
  const files = await readdir(dir, { recursive: true });
  const publishedPaths = files.filter(file => file.endsWith('/index.html')).map(file => `/${file.replace(/index\.html$/, '')}`);
  const redirects = legacyRedirects(pages.map(page => page.data), undefined, undefined, publishedPaths);
  await writeFile(new URL('_redirects.nginx', dir), nginxRedirectMap(redirects));
}
