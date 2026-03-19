export type Locale = 'fr' | 'en';

export const defaultLocale: Locale = 'fr';
export const locales: Locale[] = ['fr', 'en'];

export const kidsCategories = [
  'animaux',
  'vehicules',
  'nature',
  'alphabet',
  'dinosaures',
  'super-heros',
  'espace',
  'princesses-chevaliers',
  'metiers',
  'sport',
  'saisons',
  'fetes',
] as const;

export const adultCategories = [
  'mandalas',
  'mosaiques',
  'abstrait',
  'cartes',
  'paysages',
] as const;

export const categories = [...kidsCategories, ...adultCategories] as const;

export type Category = (typeof categories)[number];

const translations: Record<string, Record<Locale, string>> = {
  'site.title': {
    fr: 'Coloriages Gratuits à Imprimer',
    en: 'Free Printable Coloring Pages',
  },
  'site.description': {
    fr: 'Des centaines de coloriages gratuits à imprimer pour les enfants et les adultes. Animaux, véhicules, mandalas, mosaïques et plus encore !',
    en: 'Hundreds of free printable coloring pages for kids and adults. Animals, vehicles, mandalas, mosaics and more!',
  },
  'nav.home': { fr: 'Accueil', en: 'Home' },
  'nav.categories': { fr: 'Catégories', en: 'Categories' },
  'audience.enfants': { fr: 'Enfants', en: 'Kids' },
  'audience.adultes': { fr: 'Adultes', en: 'Adults' },
  'category.animaux': { fr: 'Animaux', en: 'Animals' },
  'category.vehicules': { fr: 'Véhicules', en: 'Vehicles' },
  'category.nature': { fr: 'Nature', en: 'Nature' },
  'category.alphabet': { fr: 'Alphabet', en: 'Alphabet' },
  'category.dinosaures': { fr: 'Dinosaures', en: 'Dinosaurs' },
  'category.super-heros': { fr: 'Super-héros', en: 'Superheroes' },
  'category.espace': { fr: 'Espace', en: 'Space' },
  'category.princesses-chevaliers': { fr: 'Princesses & Chevaliers', en: 'Princesses & Knights' },
  'category.metiers': { fr: 'Métiers', en: 'Jobs' },
  'category.sport': { fr: 'Sport', en: 'Sport' },
  'category.saisons': { fr: 'Saisons', en: 'Seasons' },
  'category.fetes': { fr: 'Fêtes', en: 'Holidays' },
  'category.mandalas': { fr: 'Mandalas', en: 'Mandalas' },
  'category.mosaiques': { fr: 'Mosaïques', en: 'Mosaics' },
  'category.abstrait': { fr: 'Abstrait', en: 'Abstract' },
  'category.cartes': { fr: 'Cartes', en: 'Maps' },
  'category.paysages': { fr: 'Paysages', en: 'Landscapes' },
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

const enSlugs: Record<Category, string> = {
  animaux: 'animals',
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
  paysages: 'landscapes',
};

export function getCategorySlug(category: Category, locale: Locale): string {
  if (locale === 'en') {
    return enSlugs[category];
  }
  return category;
}

export function getColoringBasePath(locale: Locale): string {
  return locale === 'fr' ? 'coloriage' : 'coloring';
}
