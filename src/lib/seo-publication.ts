import { readdir, writeFile } from 'node:fs/promises';
import { getPublishableColoriages } from './coloriages';
import { legacyRedirects, nginxRedirectMap } from './legacy-redirects';

const lastModified = new Map<string, string>();
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
