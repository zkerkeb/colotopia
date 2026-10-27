/** Validate the generated artifact, not the retired YAML catalogue. */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { parse } from 'parse5';

const root = resolve('dist'), site = 'https://colotopia.com';
const pageRedirects = JSON.parse(await readFile('src/data/page-redirects.json', 'utf8'));
const files = [];
async function scan(dir) { for (const item of await readdir(dir, { withFileTypes: true })) { const path = resolve(dir, item.name); if (item.isDirectory()) await scan(path); else files.push(path); } }
await scan(root);
const fileSet = new Set(files), pages = new Map(), errors = new Set(), remote = new Set();
const normalized = path => path.endsWith('/') ? path : `${path}/`;
const locate = path => [resolve(root, `.${decodeURIComponent(path)}`), resolve(root, `.${decodeURIComponent(path)}`, 'index.html'), resolve(root, `.${decodeURIComponent(path)}.html`)].find(file => fileSet.has(file));
const walk = (node, visit) => { visit(node); for (const child of node.childNodes ?? []) walk(child, visit); };
const content = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(content).join('');
for (const file of files.filter(file => extname(file) === '.html')) {
  const path = '/' + relative(root, file).replace(/index\.html$/, '');
  const page = { file, path, refs: [], anchors: [], alternates: [], ids: new Set(), canonical: null, noindex: false, redirect: false, h1: 0, title: '', description: '' };
  const document = parse(await readFile(file, 'utf8'));
  walk(document, node => {
    const a = Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
    if (a.id) { if (page.ids.has(a.id)) errors.add(`${path}: duplicate id ${a.id}`); page.ids.add(a.id); }
    if (node.tagName === 'a' && a.href) page.anchors.push(a.href);
    if (node.tagName === 'h1') page.h1++;
    if (node.tagName === 'title') page.title = content(node).trim();
    if (a.name === 'description') page.description = a.content;
    if (a.name === 'robots' && a.content?.includes('noindex')) page.noindex = true;
    if (a['http-equiv']?.toLowerCase() === 'refresh') page.redirect = true;
    if (a.rel === 'canonical') page.canonical = a.href;
    if (a.hreflang) page.alternates.push({ lang: a.hreflang, href: a.href });
    if (node.tagName === 'img' && !Object.hasOwn(a, 'alt')) errors.add(`${path}: image missing alt: ${a.src}`);
    for (const key of ['href', 'src', 'action']) if (a[key]) page.refs.push(a[key]);
    if (a.srcset) page.refs.push(...a.srcset.split(',').map(src => src.trim().split(/\s+/)[0]));
    if (a.type === 'application/ld+json') {
      try {
        const data = JSON.parse(content(node));
        function validate(value) {
          if (!value || typeof value !== 'object') return;
          if (value['@type'] === 'BreadcrumbList') for (const item of value.itemListElement ?? []) if (!item.name?.trim()) errors.add(`${path}: breadcrumb without name`);
          for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(validate); else validate(child);
        }
        validate(data);
      } catch { errors.add(`${path}: invalid JSON-LD`); }
    }
  });
  pages.set(file, page);
}
let checkedLinks = 0, alternateCount = 0;
for (const page of pages.values()) {
  if (!page.redirect) {
    if (page.h1 !== 1) errors.add(`${page.path}: ${page.h1} H1 headings`);
    if (!page.title || !page.description) errors.add(`${page.path}: missing title/description`);
    if (/^\/(fr\/coloriage|en\/coloring)\//.test(page.path) && (/^Colotopia\s*[—–-]/.test(page.title) || page.title === 'Colotopia')) errors.add(`${page.path}: generic drawing title`);
    if (!page.noindex && !page.canonical) errors.add(`${page.path}: missing canonical`);
    if (page.canonical && normalized(new URL(page.canonical).pathname) !== normalized(page.path)) errors.add(`${page.path}: canonical points elsewhere: ${page.canonical}`);
  }
  for (const ref of page.refs) {
    let url; try { url = new URL(ref, site + page.path); } catch { errors.add(`${page.path}: invalid URL ${ref}`); continue; }
    if (url.hostname === 'cdn.colotopia.com' && /\.(png|webp|jpe?g)$/.test(url.pathname)) remote.add(url.href);
    if (url.origin !== site) continue;
    checkedLinks++;
    const target = locate(url.pathname);
    if (!target) errors.add(`${page.path}: broken link ${ref}`);
    else if (url.hash && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) errors.add(`${page.path}: missing anchor ${ref}`);
  }
  for (const alternate of page.alternates.filter(a => a.lang !== 'x-default')) {
    alternateCount++;
    const target = pages.get(locate(new URL(alternate.href).pathname));
    if (!target || target.redirect || target.noindex) errors.add(`${page.path}: invalid alternate ${alternate.href}`);
    else if (!target.alternates.some(a => normalized(new URL(a.href).pathname) === normalized(page.path))) errors.add(`${page.path}: nonreciprocal alternate ${alternate.href}`);
  }
}
// Navigation must expose every published HTML page even when home/footer are shorter.
const reached = new Set(), pending = [locate('/fr/'), locate('/en/')];
while (pending.length) {
  const file = pending.shift();
  if (!file || reached.has(file)) continue;
  reached.add(file);
  const page = pages.get(file);
  for (const ref of page?.anchors ?? []) {
    const url = new URL(ref, site + page.path);
    if (url.origin === site) { const target = locate(url.pathname); if (pages.has(target) && !reached.has(target)) pending.push(target); }
  }
}
for (const page of pages.values()) if (!page.noindex && !page.redirect && !reached.has(page.file)) errors.add(`${page.path}: orphan page, unreachable through navigation`);
let sitemapUrls = 0;
for (const file of files.filter(file => /sitemap-\d+\.xml$/.test(file))) {
  const xml = await readFile(file, 'utf8');
  for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
    sitemapUrls++;
    const page = pages.get(locate(new URL(match[1]).pathname));
    if (!page || page.noindex || page.redirect) errors.add(`sitemap: invalid page ${match[1]}`);
    if (Object.hasOwn(pageRedirects, new URL(match[1]).pathname)) errors.add(`sitemap: retired page ${match[1]}`);
  }
  for (const match of xml.matchAll(/<xhtml:link[^>]*href="([^"]+)"/g)) if (!locate(new URL(match[1]).pathname)) errors.add(`sitemap: absent alternate ${match[1]}`);
}
for (const locale of ['fr', 'en']) {
  const index = JSON.parse(await readFile(resolve(root, locale, 'search-index.json'), 'utf8'));
  const seen = new Set();
  for (const item of index) {
    if (seen.has(item.slug)) errors.add(`search ${locale}: duplicate ${item.slug}`); seen.add(item.slug);
    if (!Array.isArray(item.tags) || item.tags.some(t => typeof t !== 'string')) errors.add(`search ${locale}: invalid tags ${item.slug}`);
    const target = pages.get(locate(new URL(item.url, site).pathname));
    if (!target || target.redirect) errors.add(`search ${locale}: absent or redirected page ${item.slug}`);
    if (item.thumbnail) remote.add(item.thumbnail);
  }
}
const imageXml = await readFile(resolve(root, 'sitemap-images.xml'), 'utf8');
const imagePages = new Set();
for (const match of imageXml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const entry = match[1], url = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
  const page = url && pages.get(locate(new URL(url).pathname));
  if (!page || page.noindex || page.redirect || !/^\/(fr\/coloriage|en\/coloring)\//.test(page.path)) errors.add(`image sitemap: invalid page ${url}`);
  if (imagePages.has(url)) errors.add(`image sitemap: duplicate page ${url}`);
  imagePages.add(url);
  const imageUrl = entry.match(/<image:loc>(.*?)<\/image:loc>/)?.[1];
  if (!imageUrl || !/^https:\/\/cdn\.colotopia\.com\/coloriages\/.+\.webp$/.test(imageUrl)) errors.add(`image sitemap: invalid image ${imageUrl}`);
  const modified = entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
  if (!modified || !Number.isFinite(Date.parse(modified))) errors.add(`image sitemap: invalid lastmod for ${url}`);
}
for (const page of pages.values()) if (!page.redirect && /^\/(fr\/coloriage|en\/coloring)\//.test(page.path) && !imagePages.has(site + page.path)) errors.add(`image sitemap: missing ${page.path}`);
const sitemapIndex = await readFile(resolve(root, 'sitemap-index.xml'), 'utf8');
if (!sitemapIndex.includes(`${site}/sitemap-images.xml`)) errors.add('image sitemap: absent from sitemap index');
const redirectMap = await readFile(resolve(root, '_redirects.nginx'), 'utf8');
for (const [from, to] of Object.entries(pageRedirects)) {
  if (!redirectMap.includes(`${JSON.stringify(from)} ${JSON.stringify(to)};`)) errors.add(`nginx map: missing redirect ${from}`);
  const target = pages.get(locate(to));
  if (!target || target.redirect || target.noindex || Object.hasOwn(pageRedirects, to)) errors.add(`nginx map: invalid destination ${from} -> ${to}`);
}
const report = { pages: pages.size, checkedLinks, alternateCount, sitemapUrls, imageSitemapUrls: imagePages.size, pageRedirects: Object.keys(pageRedirects).length, remoteImages: remote.size, errors: [...errors] };
await writeFile('/tmp/colotopia-site-verification.json', JSON.stringify(report, null, 2));
await writeFile('/tmp/colotopia-remote-images.json', JSON.stringify([...remote]));
console.log(JSON.stringify({ ...report, errors: report.errors.slice(0, 35), totalErrors: errors.size }, null, 2));
if (errors.size) process.exitCode = 1;
