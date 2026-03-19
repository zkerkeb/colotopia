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
  'personnages',
  'contes',
  'drole',
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
  'category.personnages': { fr: 'Personnages', en: 'Characters' },
  'category.contes': { fr: 'Contes', en: 'Fairy Tales' },
  'category.drole': { fr: 'Drôle', en: 'Funny' },
  'category.paysages': { fr: 'Paysages', en: 'Landscapes' },
  'coloring.download': { fr: 'Télécharger le PDF', en: 'Download PDF' },
  'coloring.print': { fr: 'Imprimer', en: 'Print' },
  'footer.rights': {
    fr: 'Tous droits réservés',
    en: 'All rights reserved',
  },
  'footer.kids': { fr: 'Coloriages Enfants', en: 'Kids Coloring' },
  'footer.adults': { fr: 'Coloriages Adultes', en: 'Adult Coloring' },
  'footer.legal': { fr: 'Informations', en: 'Information' },
  'footer.privacy': { fr: 'Politique de confidentialité', en: 'Privacy Policy' },
  'footer.terms': { fr: "Conditions d'utilisation", en: 'Terms of Use' },
  'footer.contact': { fr: 'Contact', en: 'Contact' },
  'share.label': { fr: 'Partager', en: 'Share' },
  'share.whatsapp': { fr: 'Partager sur WhatsApp', en: 'Share on WhatsApp' },
  'share.facebook': { fr: 'Partager sur Facebook', en: 'Share on Facebook' },
  'share.pinterest': { fr: 'Épingler sur Pinterest', en: 'Pin on Pinterest' },
  'legal.privacy.title': { fr: 'Politique de confidentialité', en: 'Privacy Policy' },
  'legal.terms.title': { fr: "Conditions d'utilisation", en: 'Terms of Use' },
  'home.hero.subtitle': {
    fr: 'Des centaines de coloriages originaux pour les enfants. Téléchargez, imprimez et coloriez !',
    en: 'Hundreds of original coloring pages for kids. Download, print and color!',
  },
  'home.empty': {
    fr: 'Les coloriages arrivent bientôt ! Revenez nous voir.',
    en: 'Coloring pages coming soon! Check back later.',
  },
  'category.description': {
    fr: 'Découvrez nos coloriages {label} gratuits à imprimer.',
    en: 'Discover our free printable {label} coloring pages.',
  },
  'category.empty': {
    fr: 'Les coloriages {label} arrivent bientôt !',
    en: '{label} coloring pages coming soon!',
  },
  'categories.title': {
    fr: 'Toutes les Catégories',
    en: 'All Categories',
  },
  'categories.description': {
    fr: 'Parcourez toutes nos catégories de coloriages gratuits à imprimer.',
    en: 'Browse all our free printable coloring page categories.',
  },
  'categories.count': {
    fr: '{count} coloriages',
    en: '{count} coloring pages',
  },
  'categories.explore': {
    fr: 'Voir les coloriages',
    en: 'View coloring pages',
  },
};

export function t(key: string, locale: Locale): string {
  return translations[key]?.[locale] ?? key;
}

export function ti(key: string, locale: Locale, params: Record<string, string>): string {
  let result = t(key, locale);
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, v);
  }
  return result;
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
  personnages: 'characters',
  contes: 'fairy-tales',
  drole: 'funny',
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

export function getPrivacyPath(locale: Locale): string {
  return getLocalePath(locale, locale === 'fr' ? '/confidentialite' : '/privacy');
}

export function getTermsPath(locale: Locale): string {
  return getLocalePath(locale, locale === 'fr' ? '/conditions' : '/terms');
}

export function getCategoriesPath(locale: Locale): string {
  return getLocalePath(locale, locale === 'fr' ? '/categories' : '/categories');
}
