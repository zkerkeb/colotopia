/**
 * Maps a URL on colotopia.com to its hreflang alternate in the other locale.
 * Used by the sitemap serialize callback to generate correct hreflang links
 * for translated paths (coloriage/coloring, animaux/animals, slug differences).
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const frToEnCategories: Record<string, string> = {
  animaux: 'animals',
  'animaux-marins': 'sea-animals',
  ferme: 'farm',
  vehicules: 'vehicles',
  nature: 'nature',
  alphabet: 'alphabet',
  dinosaures: 'dinosaurs',
  'super-heros': 'superheroes',
  espace: 'space',
  'princesses-chevaliers': 'princesses-knights',
  metiers: 'jobs',
  sport: 'sport',
  saisons: 'seasons',
  fetes: 'holidays',
  mandalas: 'mandalas',
  mosaiques: 'mosaics',
  abstrait: 'abstract',
  cartes: 'maps',
  personnages: 'characters',
  contes: 'fairy-tales',
  drole: 'funny',
  musique: 'music',
  nourriture: 'food',
  pirates: 'pirates',
  robots: 'robots',
  paysages: 'landscapes',
};

const enToFrCategories: Record<string, string> = Object.fromEntries(
  Object.entries(frToEnCategories).map(([fr, en]) => [en, fr]),
);

const frCategorySet = new Set(Object.keys(frToEnCategories));
const enCategorySet = new Set(Object.values(frToEnCategories));

const SITE = 'https://colotopia.com';

// Build slug mapping from YAML content files (image-based pairing)
let _frToEnSlugs: Record<string, string> | null = null;
let _enToFrSlugs: Record<string, string> | null = null;

function parseYamlSlugAndLocale(content: string): { slug?: string; locale?: string; image?: string } {
  const slug = content.match(/^slug:\s*(.+)$/m)?.[1]?.trim();
  const locale = content.match(/^locale:\s*(.+)$/m)?.[1]?.trim();
  const image = content.match(/^image:\s*(.+)$/m)?.[1]?.trim();
  return { slug, locale, image };
}

function loadSlugMaps() {
  if (_frToEnSlugs) return;
  _frToEnSlugs = {};
  _enToFrSlugs = {};

  const contentDir = join(process.cwd(), 'src', 'content', 'coloriages');
  if (!existsSync(contentDir)) return;

  const imageToFr: Record<string, string> = {};
  const imageToEn: Record<string, string> = {};

  function scanDir(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(path);
      } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        const raw = readFileSync(path, 'utf-8');
        const { slug, locale, image } = parseYamlSlugAndLocale(raw);
        if (slug && locale && image) {
          if (locale === 'fr') imageToFr[image] = slug;
          else if (locale === 'en') imageToEn[image] = slug;
        }
      }
    }
  }

  scanDir(contentDir);

  for (const [image, enSlug] of Object.entries(imageToEn)) {
    const frSlug = imageToFr[image];
    if (frSlug) {
      _frToEnSlugs![frSlug] = enSlug;
      _enToFrSlugs![enSlug] = frSlug;
    }
  }
}

export function getAlternateUrl(url: string): { locale: string; altLocale: string; altUrl: string } | null {
  loadSlugMaps();
  const path = url.replace(SITE, '');

  // FR pages
  if (path.startsWith('/fr/')) {
    const rest = path.slice(4);

    // Individual coloring page: /fr/coloriage/{slug}/
    const colorMatch = rest.match(/^coloriage\/([^/]+)\/?$/);
    if (colorMatch) {
      const frSlug = colorMatch[1];
      const enSlug = _frToEnSlugs?.[frSlug] ?? frSlug;
      return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/coloring/${enSlug}/` };
    }

    // Blog pages: /fr/blog/ or /fr/blog/{slug}/
    if (rest === 'blog/' || rest === 'blog') {
      return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/blog/` };
    }
    const blogMatch = rest.match(/^blog\/([^/]+)\/?$/);
    if (blogMatch) {
      return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/blog/${blogMatch[1]}/` };
    }
    const blogPageMatch = rest.match(/^blog\/(\d+)\/?$/);
    if (blogPageMatch) {
      return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/blog/${blogPageMatch[1]}/` };
    }

    // Legal pages
    if (rest === 'confidentialite/' || rest === 'confidentialite') {
      return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/privacy/` };
    }
    if (rest === 'conditions/' || rest === 'conditions') {
      return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/terms/` };
    }

    // Category pages: /fr/{category}/ or /fr/{category}/{page}/
    const catMatch = rest.match(/^([^/]+)\/((\d+)\/)?$/);
    if (catMatch && frCategorySet.has(catMatch[1])) {
      const enCat = frToEnCategories[catMatch[1]];
      const pageNum = catMatch[3];
      return {
        locale: 'fr',
        altLocale: 'en',
        altUrl: pageNum ? `${SITE}/en/${enCat}/${pageNum}/` : `${SITE}/en/${enCat}/`,
      };
    }

    // Home + pagination: /fr/ or /fr/{page}/
    return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/${rest}` };
  }

  // EN pages
  if (path.startsWith('/en/')) {
    const rest = path.slice(4);

    // Individual coloring page: /en/coloring/{slug}/
    const colorMatch = rest.match(/^coloring\/([^/]+)\/?$/);
    if (colorMatch) {
      const enSlug = colorMatch[1];
      const frSlug = _enToFrSlugs?.[enSlug] ?? enSlug;
      return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/coloriage/${frSlug}/` };
    }

    // Blog pages: /en/blog/ or /en/blog/{slug}/
    if (rest === 'blog/' || rest === 'blog') {
      return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/blog/` };
    }
    const enBlogMatch = rest.match(/^blog\/([^/]+)\/?$/);
    if (enBlogMatch) {
      return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/blog/${enBlogMatch[1]}/` };
    }
    const enBlogPageMatch = rest.match(/^blog\/(\d+)\/?$/);
    if (enBlogPageMatch) {
      return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/blog/${enBlogPageMatch[1]}/` };
    }

    // Legal pages
    if (rest === 'privacy/' || rest === 'privacy') {
      return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/confidentialite/` };
    }
    if (rest === 'terms/' || rest === 'terms') {
      return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/conditions/` };
    }

    // Category pages: /en/{category}/ or /en/{category}/{page}/
    const catMatch = rest.match(/^([^/]+)\/((\d+)\/)?$/);
    if (catMatch && enCategorySet.has(catMatch[1])) {
      const frCat = enToFrCategories[catMatch[1]];
      const pageNum = catMatch[3];
      return {
        locale: 'en',
        altLocale: 'fr',
        altUrl: pageNum ? `${SITE}/fr/${frCat}/${pageNum}/` : `${SITE}/fr/${frCat}/`,
      };
    }

    // Home + pagination: /en/ or /en/{page}/
    return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/${rest}` };
  }

  // Root URL
  if (path === '/' || path === '') {
    return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/` };
  }

  return null;
}
