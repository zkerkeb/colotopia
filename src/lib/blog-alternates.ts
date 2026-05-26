const frToEnBlogSlugs: Record<string, string> = {
  'bienfaits-coloriage-enfants': 'benefits-of-coloring-for-children',
  'coloriage-anti-stress-adultes': 'anti-stress-coloring-adults-guide',
  'coloriage-halloween-gratuit-imprimer': 'halloween-coloring-pages',
  'coloriage-licorne-gratuit-imprimer': 'unicorn-coloring-pages',
  'coloriage-meditation-relaxation': 'coloring-meditation-relax-while-coloring',
  'coloriage-noel-gratuit-imprimer': 'free-christmas-coloring-pages-print',
  'coloriage-paques': 'easter-coloring-pages-free-designs',
  'coloriage-voiture-vehicules-enfants': 'vehicle-coloring-pages',
  'coloriages-dinosaures-guide': 'dinosaur-coloring-pages-ultimate-guide',
  'coloriages-educatifs': 'educational-coloring-pages-learn-fun',
  'coloriages-enfants-2-5-ans': 'best-coloring-pages-kids-ages-2-5',
  'coloriages-espace-planetes': 'space-planet-coloring-pages',
  'coloriages-ferme-tout-petits': 'farm-coloring-pages-toddlers',
  'coloriages-kawaii-tendance-mignon': 'kawaii-coloring-pages-trendy-cute',
  'coloriages-princesses-chevaliers': 'princess-knight-coloring-pages-kids',
  'colorier-mandala-techniques': 'how-to-color-mandala-tips-techniques',
  'meilleurs-coloriages-animaux': 'top-animal-coloring-pages-print',
  'motricite-fine-coloriage': 'developing-fine-motor-skills-coloring',
};

const enToFrBlogSlugs: Record<string, string> = Object.fromEntries(
  Object.entries(frToEnBlogSlugs).map(([fr, en]) => [en, fr]),
);

export function getTranslatedBlogSlug(locale: 'fr' | 'en', slug: string): string | undefined {
  return locale === 'fr' ? frToEnBlogSlugs[slug] : enToFrBlogSlugs[slug];
}
