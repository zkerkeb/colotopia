/**
 * Maps a URL on colotopia.com to its hreflang alternate in the other locale.
 * Used by the sitemap serialize callback to generate correct hreflang links
 * for translated paths (coloriage/coloring, animaux/animals, slug differences).
 */

import { buildSlugMap } from './coloriages';
import { getTranslatedBlogSlug } from './blog-alternates';
import { categories, getCategorySlug } from './i18n';

const frToEnCategories: Record<string, string> = Object.fromEntries(
  categories.map((category) => [category, getCategorySlug(category, 'en')]),
);

const enToFrCategories: Record<string, string> = Object.fromEntries(
  Object.entries(frToEnCategories).map(([fr, en]) => [en, fr]),
);

const frCategorySet = new Set(Object.keys(frToEnCategories));
const enCategorySet = new Set(Object.values(frToEnCategories));

const SITE = 'https://colotopia.com';

const staticAlternates: Record<string, string> = {
  '/fr/a-propos/': '/en/about/',
  '/en/about/': '/fr/a-propos/',
  '/fr/categories/': '/en/categories/',
  '/en/categories/': '/fr/categories/',
  '/fr/contact/': '/en/contact/',
  '/en/contact/': '/fr/contact/',
  '/fr/confidentialite/': '/en/privacy/',
  '/en/privacy/': '/fr/confidentialite/',
  '/fr/conditions/': '/en/terms/',
  '/en/terms/': '/fr/conditions/',
};

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
  const path = normalizePath(url.replace(SITE, ''));
  const staticAlt = staticAlternates[path];
  if (staticAlt) {
    const locale = path.startsWith('/fr/') ? 'fr' : 'en';
    return {
      locale,
      altLocale: locale === 'fr' ? 'en' : 'fr',
      altUrl: `${SITE}${staticAlt}`,
    };
  }

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
    const blogPageMatch = rest.match(/^blog\/(\d+)\/?$/);
    if (blogPageMatch) {
      return { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/blog/${blogPageMatch[1]}/` };
    }
    const blogMatch = rest.match(/^blog\/([^/]+)\/?$/);
    if (blogMatch) {
      const enSlug = getTranslatedBlogSlug('fr', blogMatch[1]);
      return enSlug ? { locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/blog/${enSlug}/` } : null;
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
    const enBlogPageMatch = rest.match(/^blog\/(\d+)\/?$/);
    if (enBlogPageMatch) {
      return { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/blog/${enBlogPageMatch[1]}/` };
    }
    const enBlogMatch = rest.match(/^blog\/([^/]+)\/?$/);
    if (enBlogMatch) {
      const frSlug = getTranslatedBlogSlug('en', enBlogMatch[1]);
      return frSlug ? { locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/blog/${frSlug}/` } : null;
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

function normalizePath(path: string): string {
  const [pathname] = path.split(/[?#]/);
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

// Pre-load slug maps (called during build)
export async function initSlugMaps() {
  await loadSlugMaps();
}
