/**
 * Maps a URL on colotopia.com to its hreflang alternate in the other locale.
 * Used by the sitemap serialize callback to generate correct hreflang links
 * for translated paths (coloriage/coloring, animaux/animals, slug differences).
 */

import { buildSlugMap } from './coloriages';

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
  kawaii: 'kawaii',
  licorne: 'unicorns',
  fleurs: 'flowers',
  chats: 'cats',
  papillons: 'butterflies',
  'bold-et-facile': 'bold-easy',
  paques: 'easter',
  halloween: 'halloween',
  noel: 'christmas',
  champignons: 'mushrooms',
  religions: 'religions',
  cottagecore: 'cottagecore',
  vitrail: 'stained-glass',
  zodiaque: 'zodiac',
  affirmations: 'affirmations',
  'anti-stress': 'stress-relief',
  cirque: 'circus',
  fee: 'fairies',
  magie: 'magic',
  jardinage: 'gardening',
  insectes: 'insects',
  bricolage: 'crafts',
  architecture: 'architecture',
};

const enToFrCategories: Record<string, string> = Object.fromEntries(
  Object.entries(frToEnCategories).map(([fr, en]) => [en, fr]),
);

const frCategorySet = new Set(Object.keys(frToEnCategories));
const enCategorySet = new Set(Object.values(frToEnCategories));

const SITE = 'https://colotopia.com';

// Build slug mapping from DB (image-based pairing)
let _frToEnSlugs: Record<string, string> | null = null;
let _enToFrSlugs: Record<string, string> | null = null;

async function loadSlugMaps() {
  if (_frToEnSlugs) return;
  const { frToEn, enToFr } = await buildSlugMap();
  _frToEnSlugs = frToEn;
  _enToFrSlugs = enToFr;
}

export function getAlternateUrl(url: string): { locale: string; altLocale: string; altUrl: string } | null {
  // Note: loadSlugMaps is called at build start via the sitemap integration
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
      return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/fr/blog/${blogPageMatch[1]}/` };
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
      return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/en/blog/${enBlogPageMatch[1]}/` };
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

// Pre-load slug maps (called during build)
export async function initSlugMaps() {
  await loadSlugMaps();
}
