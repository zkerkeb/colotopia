/** JSON embedded in a script must not be able to close that script. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/** Empty legacy database fields must fall back to the drawing, not the homepage. */
export function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

export function coloringMetadata(locale: 'fr' | 'en', title: string, seoTitle?: string, seoDescription?: string) {
  return {
    title: optionalText(seoTitle) ?? (locale === 'fr' ? `Coloriage ${title} à imprimer` : `${title} Coloring Page`),
    description: optionalText(seoDescription) ?? (locale === 'fr'
      ? `Téléchargez gratuitement le coloriage « ${title} » en PDF A4 à imprimer. Choisissez vos couleurs et découvrez d’autres dessins sur Colotopia.`
      : `Download the ${title} coloring page as a free printable A4 PDF. Choose your colors and explore more coloring pages on Colotopia.`),
  };
}
