import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { getAlternateUrl, initSlugMaps } from './src/lib/sitemap-alternates.ts';
import { initSeoPublication, getLastModified, writePublicationArtifacts } from './src/lib/seo-publication.ts';
import pageRedirects from './src/data/page-redirects.json';


export default defineConfig({
  site: 'https://colotopia.com',
  output: 'static',
  compressHTML: true,
  redirects: { '/fr/licornes': '/fr/licorne/', '/fr/fees': '/fr/fee/', '/en/unicorns-2': '/en/unicorns/', '/en/fairies-2': '/en/fairies/', ...Object.fromEntries(Object.entries(pageRedirects).map(([from, to]) => [from.replace(/\/$/, ''), to])) },
  integrations: [
    { name: 'catalog-alternates', hooks: { 'astro:build:start': initSlugMaps } },
    { name: 'seo-publication', hooks: { 'astro:build:start': initSeoPublication, 'astro:build:done': ({ dir }) => writePublicationArtifacts(dir) } },
    sitemap({
      customSitemaps: ['https://colotopia.com/sitemap-images.xml'],
      filter: (page) => {
        const pathname = new URL(page).pathname;
        if (Object.hasOwn(pageRedirects, `${pathname.replace(/\/$/, '')}/`) || /\.(xml|pdf)$/.test(pathname)) return false;
        // Exclude root redirect, 404, and pagination pages (low crawl-budget value)
        if (page === 'https://colotopia.com/') return false;
        if (page.includes('/404') || /\/(recherche|search|licornes|fees|unicorns-2|fairies-2)\/?$/.test(page)) return false;
        // Exclude pagination: /fr/2/, /en/animals/3/, /fr/blog/2/ etc.
        if (/\/(fr|en)\/(.*\/)?(\d+)\/$/.test(page)) return false;
        return true;
      },
      serialize(item) {
        const lastmod = getLastModified(item.url);
        if (lastmod) item.lastmod = lastmod;
        const alt = getAlternateUrl(item.url);
        if (alt) {
          const defaultUrl = alt.locale === 'fr' ? item.url : alt.altUrl;
          item.links = [
            { lang: alt.locale, url: item.url },
            { lang: alt.altLocale, url: alt.altUrl },
            { lang: 'x-default', url: defaultUrl },
          ];
        }
        return item;
      },
    }),
    mdx(),
  ],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  vite: {
    server: { proxy: { '/cdn/': { target: 'https://cdn.colotopia.com', changeOrigin: true, rewrite: path => path.replace(/^\/cdn/, '') } } },
  },
  image: {
    domains: ['cdn.colotopia.com'],
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
