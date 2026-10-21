/** Normalize legacy DB values at the publication boundary. */
export function normalizeTags(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean))]
    : [];
}

export function canonicalCategory(category: string): string {
  return ({ licornes: 'licorne', fees: 'fee' } as Record<string, string>)[category] ?? category;
}

/** Only unambiguous pairs are valid reciprocal language alternates. */
export function pairTranslations(fr: { slug: string; image: string }[], en: { slug: string; image: string }[], stablePairs: readonly (readonly string[])[] = []) {
  const group = (items: typeof fr) => {
    const result = new Map<string, string[]>();
    for (const item of items) result.set(item.image, [...(result.get(item.image) ?? []), item.slug]);
    return result;
  };
  const left = group(fr), right = group(en);
  const frToEn: Record<string, string> = {}, enToFr: Record<string, string> = {};
  const frSlugs = new Set(fr.map(item => item.slug)), enSlugs = new Set(en.map(item => item.slug));
  for (const [frSlug, enSlug] of stablePairs) {
    if (!frSlugs.has(frSlug) || !enSlugs.has(enSlug)) continue;
    if (frToEn[frSlug] || enToFr[enSlug]) throw new Error(`Ambiguous stable translation: ${frSlug} / ${enSlug}`);
    frToEn[frSlug] = enSlug;
    enToFr[enSlug] = frSlug;
  }
  for (const [image, slugs] of left) {
    const translations = right.get(image);
    if (slugs.length === 1 && translations?.length === 1 && !frToEn[slugs[0]] && !enToFr[translations[0]]) {
      frToEn[slugs[0]] = translations[0];
      enToFr[translations[0]] = slugs[0];
    }
  }
  return { frToEn, enToFr };
}
