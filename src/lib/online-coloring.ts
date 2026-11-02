import type { Locale } from './i18n';
export const onlinePath = (locale: Locale) => locale === 'fr' ? '/fr/coloriage-en-ligne/' : '/en/online-coloring/';
export const paintingHref = (locale: Locale, slug: string) => `/${locale}/${locale === 'fr' ? 'coloriage' : 'coloring'}/${slug}/#colorier`;
export const onlineFeatured = ['animaux-chat', 'bold-et-facile-dinosaure', 'bold-et-facile-licorne', 'animaux-lapin', 'espace-fusee', 'noel-sapin-decore', 'animaux-papillon', 'vehicules-voiture', 'kawaii-chat', 'mandalas-fleur', 'animaux-chien', 'animaux-tortue'];
