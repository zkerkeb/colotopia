import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { getAlternateUrl, initSlugMaps } from './src/lib/sitemap-alternates.ts';


export default defineConfig({
  site: 'https://colotopia.com',
  output: 'static',
  compressHTML: true,
  redirects: { '/fr/licornes': '/fr/licorne/', '/fr/fees': '/fr/fee/', '/en/unicorns-2': '/en/unicorns/', '/en/fairies-2': '/en/fairies/' },
  integrations: [
    { name: 'catalog-alternates', hooks: { 'astro:build:start': initSlugMaps } },
    sitemap({
      filter: (page) => {
        // Exclude root redirect, 404, and pagination pages (low crawl-budget value)
        if (page === 'https://colotopia.com/') return false;
        if (page.includes('/404') || /\/(recherche|search|licornes|fees|unicorns-2|fairies-2)\/?$/.test(page)) return false;
        // Exclude pagination: /fr/2/, /en/animals/3/, /fr/blog/2/ etc.
        if (/\/(fr|en)\/(.*\/)?(\d+)\/$/.test(page)) return false;
        return true;
      },
      serialize(item) {
        const alt = getAlternateUrl(item.url);
        if (alt) {
          const defaultUrl = alt.locale === 'fr' ? item.url : alt.altUrl;
          item.links = [
            { lang: alt.locale === 'fr' ? 'fr-FR' : 'en-US', url: item.url },
            { lang: alt.altLocale === 'fr' ? 'fr-FR' : 'en-US', url: alt.altUrl },
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
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
