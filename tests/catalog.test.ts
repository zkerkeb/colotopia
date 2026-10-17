import { jsonLd } from '../src/lib/seo';
import { cdnPng, cdnThumb } from '../src/lib/cdn';
import { describe, it, expect } from 'vitest';
import { canonicalCategory, normalizeTags, pairTranslations } from '../src/lib/catalog';
import { parseSearchIndex, searchCatalog } from '../src/lib/search';
import { fitA4, pdfFilename } from '../src/lib/pdf';
import { getCategorySlug, kidsCategories } from '../src/lib/i18n';

describe('published catalog regressions', () => {
  it.each([{}, null, undefined, 'cat', 3])('tolerates malformed legacy tags: %s', value => expect(normalizeTags(value)).toEqual([]));
  it('keeps only unique nonempty strings', () => expect(normalizeTags([' chat ', 'chat', null, 2, ''])).toEqual(['chat']));
  it('consolidates taxonomy without losing old URL mappings', () => {
    expect(canonicalCategory('licornes')).toBe('licorne'); expect(canonicalCategory('fees')).toBe('fee');
    expect(getCategorySlug('licornes', 'en')).toBe('unicorns'); expect(getCategorySlug('fees', 'fr')).toBe('fee');
    expect(kidsCategories).not.toContain('licornes'); expect(kidsCategories).not.toContain('fees');
  });
  it('does not invent translations for unmatched or ambiguous images', () => {
    expect(pairTranslations([{ slug: 'chat', image: 'a' }, { slug: 'lapin', image: 'b' }], [{ slug: 'cat', image: 'a' }])).toEqual({ frToEn: { chat: 'cat' }, enToFr: { cat: 'chat' } });
    expect(pairTranslations([{ slug: 'chat', image: 'a' }], [{ slug: 'cat', image: 'a' }, { slug: 'kitten', image: 'a' }])).toEqual({ frToEn: {}, enToFr: {} });
  });
});
describe('search', () => {
  const index = parseSearchIndex([{ title: 'Fée étoilée', tags: {}, category: 'fee', url: '/fr/coloriage/fee-etoilee/', audience: 'enfants' }, { title: 'Mandala lune', tags: ['étoile'], category: 'mandalas', url: '/fr/coloriage/mandala-lune/', audience: 'adultes' }]);
  it('finds accents and multiple words even with malformed tags', () => expect(searchCatalog(index, 'fee etoilee')).toHaveLength(1));
  it('filters the whole catalog and handles empty/no-match searches', () => { expect(searchCatalog(index, '', 'adultes')).toHaveLength(1); expect(searchCatalog(index, 'introuvable')).toEqual([]); });
  it('rejects unsafe or unrelated result URLs', () => expect(parseSearchIndex([{ title: 'unsafe', url: 'javascript:alert(1)' }, { title: 'external', url: '//other.test/a' }])).toEqual([]));
  it('does not silently treat a failed JSON payload as zero results', () => expect(() => parseSearchIndex({ error: 'bad' })).toThrow());
  it('returns more than eight results for the results page', () => expect(searchCatalog(Array(50).fill(index[0]), 'fee')).toHaveLength(50));
});
describe('printable PDF geometry', () => {
  it.each([[2480,3508],[3508,2480],[1,10000]])('fits %s × %s entirely inside A4 margins', (w,h) => { const b=fitA4(w,h); expect(b.x).toBeGreaterThanOrEqual(10); expect(b.y).toBeGreaterThanOrEqual(10); expect(b.width).toBeLessThanOrEqual(190); expect(b.height).toBeLessThanOrEqual(277); expect(b.width/b.height).toBeCloseTo(w/h); });
  it('rejects invalid sizes', () => expect(() => fitA4(0,100)).toThrow());
  it('keeps readable accented filenames and a fallback', () => { expect(pdfFilename('Fée étoilée')).toBe('fee-etoilee.pdf'); expect(pdfFilename('✨')).toBe('colotopia.pdf'); });
});

it('escapes script termination in structured data', () => { const value = {name: '</script><script>alert(1)</script>'}; expect(jsonLd(value)).not.toContain('<'); expect(JSON.parse(jsonLd(value))).toEqual(value); });
it('repairs known translated image keys for every format', () => { expect(cdnPng('architecture-castle')).toBe('https://cdn.colotopia.com/coloriages/architecture-chateau-fort.png'); expect(cdnThumb('portrait-child-astronaut')).toBe('https://cdn.colotopia.com/coloriages/thumbs/portrait-enfant-astronaute.webp'); });
