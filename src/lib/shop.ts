import { adultCategories, type Locale } from './i18n';

export type BookId = 'woodland' | 'animals' | 'gardens';
export interface ShopBook {
  id: BookId; locale: Locale; slug: string; title: string; description: string;
  detail: string; audience: string; pages: number; language: string;
  image: string; thumbnail: string; imageAlt: string; preview: string; sample: string;
  listingId: string; etsyUrl: string; href: string; priceLabel: string;
}
export const bookIds: BookId[] = ['woodland', 'animals', 'gardens'];
export const shopPath = (locale: Locale) => locale === 'fr' ? '/fr/boutique/' : '/en/shop/';
const slugs = {
  woodland: { fr: 'le-tresor-de-la-foret', en: 'the-woodland-treasure' },
  animals: { fr: 'les-animaux-font-les-fous', en: 'funny-animals' },
  gardens: { fr: 'petites-maisons-jardins-secrets', en: 'little-houses-secret-gardens' },
};
/** Seller prices were verified on Etsy on 2026-10-31. EUR is indicative only.
 * No Offer schema: Etsy controls the live currency conversion, taxes and checkout.
 */
export function getBook(id: BookId, locale: Locale): ShopBook {
  const fr = locale === 'fr';
  const asset = id === 'woodland' ? `woodland-${locale}` : id;
  const listingId = id === 'woodland' ? (fr ? '4605054791' : '4605081534') : id === 'animals' ? '4607014948' : '4606995589';
  const titles = {
    woodland: fr ? 'Le trésor de la forêt' : 'The Woodland Treasure',
    animals: fr ? 'Les animaux font les fous' : 'Funny Animals',
    gardens: fr ? 'Petites maisons, jardins secrets' : 'Little Houses, Secret Gardens',
  };
  const descriptions = {
    woodland: fr ? 'Une aventure en forêt avec 48 pages de jeux, énigmes et coloriages pour les 6–9 ans. Cahier de 60 pages à imprimer, avec les solutions.' : 'A woodland adventure with 48 pages of games, puzzles and coloring for ages 6–9. A 60-page printable activity book, including answers.',
    animals: fr ? '50 animaux rigolos à colorier pour les 6–9 ans : un hérisson pâtissier, des compagnons farceurs et de petites scènes pleines de détails.' : '50 funny animal coloring pages for ages 6–9: a hedgehog baker, playful friends and little scenes full of details.',
    gardens: fr ? '50 coloriages pour adultes, entre petites maisons, fleurs et jardins secrets. Des scènes détaillées à imprimer au fil de vos envies.' : '50 coloring pages for adults, filled with little houses, flowers and secret gardens. Detailed scenes to print whenever you feel like coloring.',
  };
  return {
    id, locale, slug: slugs[id][locale], title: titles[id], description: descriptions[id],
    detail: id === 'woodland' ? (fr ? '60 pages · 6–9 ans' : '60 pages · Ages 6–9') : id === 'animals' ? (fr ? '50 coloriages · 6–9 ans' : '50 coloring pages · Ages 6–9') : (fr ? '50 coloriages · Adultes' : '50 coloring pages · Adults'),
    audience: id === 'gardens' ? (fr ? 'Adultes' : 'Adults') : (fr ? '6–9 ans' : 'Ages 6–9'),
    pages: id === 'woodland' ? 60 : 52,
    language: id === 'woodland' ? (fr ? 'Édition française' : 'English edition') : (fr ? 'Textes en français' : 'French text; illustrations to color in any language'),
    image: `/images/shop/${asset}.webp`, thumbnail: `/images/shop/${id === 'woodland' ? 'woodland-art' : id + '-page-2'}.webp`,
    imageAlt: fr ? `Présentation du cahier ${titles[id]}` : `${titles[id]} book preview`,
    preview: `/images/shop/${asset}-preview.webp`, sample: `/downloads/shop/${asset}-sample.pdf`,
    listingId, etsyUrl: `https://www.etsy.com/${fr ? 'fr/' : ''}listing/${listingId}/`,
    href: `${shopPath(locale)}${slugs[id][locale]}/`, priceLabel: fr ? '≈ 3,90 €' : 'US$3.48',
  };
}
export const getBooks = (locale: Locale) => bookIds.map(id => getBook(id, locale));
/** Adult categories always get the adult book; no unrelated offer on every page. */
export function recommendedBook(category: string, locale: Locale): ShopBook | undefined {
  if ((adultCategories as readonly string[]).includes(category)) return getBook('gardens', locale);
  if (['animaux', 'animaux-marins', 'ferme', 'chats', 'drole', 'insectes', 'papillons'].includes(category)) return getBook('animals', locale);
  if (['nature', 'contes', 'fee', 'fees', 'magie', 'champignons', 'pirates'].includes(category)) return getBook('woodland', locale);
  return undefined;
}
