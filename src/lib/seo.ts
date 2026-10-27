/** JSON embedded in a script must not be able to close that script. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/** Empty legacy database fields must fall back to the drawing, not the homepage. */
export function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

/** Preserve descriptive alt text, except the retired seed's contradictory audience claim. */
export function coloringAlt(title: string, alt: string | null | undefined, audience: string): string {
  const value = optionalText(alt);
  if (audience === 'adultes' && value && /(?:dessin au trait simple pour enfants|simple line(?: art)? drawing for (?:children|kids))/i.test(value)) return title;
  return value ?? title;
}

export function coloringMetadata(locale: 'fr' | 'en', title: string, seoTitle?: string, seoDescription?: string, audience?: string) {
  const description = optionalText(seoDescription);
  // Retired seed descriptions called even intricate adult drawings suitable for toddlers.
  const wrongAudience = audience === 'adultes' && description && /(?:enfants de 3 [aà] 8 ans|children (?:aged? )?3 (?:to|[-–]) 8|kids (?:aged? )?3 (?:to|[-–]) 8)/i.test(description);
  return {
    title: optionalText(seoTitle) ?? (locale === 'fr' ? `Coloriage ${title} à imprimer` : `${title} Coloring Page`),
    description: (!wrongAudience && description) || (locale === 'fr'
      ? `Téléchargez gratuitement le coloriage « ${title} » en PDF A4 à imprimer. Choisissez vos couleurs et découvrez d’autres dessins sur Colotopia.`
      : `Download the ${title} coloring page as a free printable A4 PDF. Choose your colors and explore more coloring pages on Colotopia.`),
  };
}
