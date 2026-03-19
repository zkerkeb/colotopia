export type Locale = 'fr' | 'en';

export const defaultLocale: Locale = 'fr';
export const locales: Locale[] = ['fr', 'en'];

export const categories = [
  'animaux',
  'vehicules',
  'nature',
  'alphabet',
  'saisons',
  'fetes',
] as const;

export type Category = (typeof categories)[number];

const translations: Record<string, Record<Locale, string>> = {
  'site.title': {
    fr: 'Coloriages Gratuits à Imprimer',
    en: 'Free Printable Coloring Pages',
  },
  'site.description': {
    fr: 'Des centaines de coloriages gratuits à imprimer pour les enfants. Animaux, véhicules, nature, alphabet et plus encore !',
    en: 'Hundreds of free printable coloring pages for kids. Animals, vehicles, nature, alphabet and more!',
  },
  'nav.home': { fr: 'Accueil', en: 'Home' },
  'nav.categories': { fr: 'Catégories', en: 'Categories' },
  'category.animaux': { fr: 'Animaux', en: 'Animals' },
  'category.vehicules': { fr: 'Véhicules', en: 'Vehicles' },
  'category.nature': { fr: 'Nature', en: 'Nature' },
  'category.alphabet': { fr: 'Alphabet', en: 'Alphabet' },
  'category.saisons': { fr: 'Saisons', en: 'Seasons' },
  'category.fetes': { fr: 'Fêtes', en: 'Holidays' },
  'coloring.download': { fr: 'Télécharger le PDF', en: 'Download PDF' },
  'coloring.print': { fr: 'Imprimer', en: 'Print' },
  'footer.rights': {
    fr: 'Tous droits réservés',
    en: 'All rights reserved',
  },
};

export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] ?? key;
}

export function getCategoryLabel(category: Category, locale: Locale): string {
  return t(`category.${category}`, locale);
}

export function getLocalePath(locale: Locale, path: string = ''): string {
  return `/${locale}${path}`;
}

export function getCategorySlug(category: Category, locale: Locale): string {
  if (locale === 'en') {
    const enSlugs: Record<Category, string> = {
      animaux: 'animals',
      vehicules: 'vehicles',
      nature: 'nature',
      alphabet: 'alphabet',
      saisons: 'seasons',
      fetes: 'holidays',
    };
    return enSlugs[category];
  }
  return category;
}

export function getColoringBasePath(locale: Locale): string {
  return locale === 'fr' ? 'coloriage' : 'coloring';
}
