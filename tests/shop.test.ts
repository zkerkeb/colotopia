import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { bookIds, getBook, getBooks, recommendedBook, shopPath } from '../src/lib/shop';
import { getAlternateUrl } from '../src/lib/sitemap-alternates';
import { adultCategories, type Locale } from '../src/lib/i18n';

describe('published Etsy books', () => {
  it('routes each language to the correct published edition', () => {
    expect(getBook('woodland', 'fr').listingId).toBe('4605054791');
    expect(getBook('woodland', 'en').listingId).toBe('4605081534');
    for (const locale of ['fr', 'en'] as Locale[]) {
      expect(getBook('animals', locale).listingId).toBe('4607014948');
      expect(getBook('gardens', locale).listingId).toBe('4606995589');
      for (const book of getBooks(locale)) {
        expect(new URL(book.etsyUrl).hostname).toBe('www.etsy.com');
        expect(new URL(book.etsyUrl).pathname).toContain(`/listing/${book.listingId}/`);
        for (const asset of [book.image, book.preview, book.sample]) expect(existsSync(`public${asset}`), asset).toBe(true);
        expect(readFileSync(`public${book.sample}`).subarray(0,5).toString()).toBe('%PDF-');
      }
    }
  });
  it('keeps complete paid PDFs private and exposes only the four approved samples', () => {
    expect(readdirSync('public/downloads/shop').sort()).toEqual(['animals-sample.pdf', 'gardens-sample.pdf', 'woodland-en-sample.pdf', 'woodland-fr-sample.pdf']);
    const publicFiles = readdirSync('public', { recursive: true }).map(String);
    expect(publicFiles.filter(path => /Numerique-|Colotopia-(FR|EN)-60pages|52p\.pdf/.test(path))).toEqual([]);
  });
  it('does not double the page counts or claim translated coloring book introductions', () => {
    expect(getBook('animals', 'fr').pages).toBe(52);
    expect(getBook('gardens', 'en').pages).toBe(52);
    expect(getBook('woodland', 'fr').pages).toBe(60);
    expect(getBook('animals', 'en').language).toContain('French text');
  });
  it('keeps reciprocal language links in HTML and the sitemap', () => {
    for (const locale of ['fr', 'en'] as Locale[]) {
      const other = locale === 'fr' ? 'en' : 'fr';
      expect(getAlternateUrl(`https://colotopia.com${shopPath(locale)}`)?.altUrl).toBe(`https://colotopia.com${shopPath(other)}`);
      for (const id of bookIds) expect(getAlternateUrl(`https://colotopia.com${getBook(id, locale).href}`)?.altUrl).toBe(`https://colotopia.com${getBook(id, other).href}`);
    }
  });
  it('recommends adult books to adult categories and omits unrelated offers', () => {
    for (const category of adultCategories) expect(recommendedBook(category, 'fr')?.id).toBe('gardens');
    expect(recommendedBook('animaux', 'fr')?.id).toBe('animals');
    expect(recommendedBook('pirates', 'en')?.listingId).toBe('4605081534');
    expect(recommendedBook('vehicules', 'fr')).toBeUndefined();
    expect(recommendedBook('unknown', 'fr')).toBeUndefined();
  });
});
