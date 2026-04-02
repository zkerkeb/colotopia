import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { getAlternateUrl } from './src/lib/sitemap-alternates.ts';

export default defineConfig({
  site: 'https://colotopia.com',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => page !== 'https://colotopia.com/',
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
