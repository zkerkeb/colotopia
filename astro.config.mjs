import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { getAlternateUrl, initSlugMaps } from './src/lib/sitemap-alternates.ts';

// Pre-load DB slug maps before build starts
await initSlugMaps();

export default defineConfig({
  site: 'https://colotopia.com',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => {
        // Exclude root redirect, 404, and pagination pages (low crawl-budget value)
        if (page === 'https://colotopia.com/') return false;
        if (page.includes('/404')) return false;
        // Exclude pagination: /fr/2/, /en/animals/3/, /fr/blog/2/ etc.
        if (/\/(fr|en)\/(.*\/)?(\d+)\/$/.test(page)) return false;
        return true;
      },
      serialize(item) {
        const alt = getAlternateUrl(item.url);
        if (alt) {
          item.links = [
            { lang: alt.locale === 'fr' ? 'fr-FR' : 'en-US', url: item.url },
            { lang: alt.altLocale === 'fr' ? 'fr-FR' : 'en-US', url: alt.altUrl },
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
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
