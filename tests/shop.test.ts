import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { bookIds, getBook, getBooks, getFeaturedBooks, recommendedBook, shopPath, type BookId } from '../src/lib/shop';
import approvedSamples from '../src/data/shop-samples.json';
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
        expect(book.listingId).toMatch(/^\d{8,12}$/);
        for (const asset of [book.image, book.thumbnail, book.preview, book.sample, ...book.pagePreviews.map(page => page.src)]) expect(existsSync(`public${asset}`), asset).toBe(true);
        expect(readFileSync(`public${book.sample}`).subarray(0,5).toString()).toBe('%PDF-');
        expect(book.samplePages).toBe(approvedSamples.find(sample => sample.path === book.sample)?.pages);
      }
    }
  });
  it('keeps complete paid PDFs private and exposes only verified free samples', () => {
    expect(readdirSync('public/downloads/shop').sort()).toEqual(approvedSamples.map(sample => sample.path.split('/').at(-1)).sort());
    for (const sample of approvedSamples) {
      const bytes = readFileSync(`public${sample.path}`);
      expect(createHash('sha256').update(bytes).digest('hex'), sample.path).toBe(sample.sha256);
      expect(sample.pages).toBeGreaterThan(0);
      expect(sample.pages).toBeLessThanOrEqual(6);
    }
    const publicFiles = readdirSync('public', { recursive: true }).map(String);
    expect(publicFiles.filter(path => /Numerique-|Colotopia-.*\.pdf|(?:25|32|34|36|52|60)p\.pdf/.test(path))).toEqual([]);
  });
  it('describes all seven new offers with their actual pages, language and license', () => {
    const pages: Partial<Record<BookId, number>> = { noel: 32, restaurant: 25, detectives: 32, monstres: 36, trajet: 34, village: 32, 'restaurant-pro': 25 };
    expect(bookIds).toHaveLength(10);
    expect(new Set(bookIds).size).toBe(10);
    for (const [id, count] of Object.entries(pages)) {
      for (const locale of ['fr', 'en'] as Locale[]) {
        const book = getBook(id as BookId, locale);
        expect(book.pages).toBe(count);
        expect(book.frenchOnly).toBe(true);
        expect(book.fileCount).toBe(id === 'restaurant-pro' ? 3 : 2);
        expect(book.samplePages).toBe(id === 'noel' || id === 'detectives' ? 5 : 4);
      }
      expect(getBook(id as BookId, 'en').language).toBe('French-language PDF');
    }
    expect(getBook('restaurant-pro', 'fr').license).toContain('Un seul établissement');
    expect(getBook('restaurant-pro', 'en').license).toContain('One physical venue');
    expect(getBook('restaurant-pro', 'fr').sample).toBe(getBook('restaurant', 'fr').sample);
    expect(getBook('restaurant-pro', 'fr').group).toBe('professional');
    expect(getBook('village', 'fr').group).toBe('adults');
    expect(getFeaturedBooks('fr')).toHaveLength(3);
    expect(getFeaturedBooks('fr').every(book => book.group !== 'professional')).toBe(true);
  });
  it('publishes only resolved article links and tracks product and sample clicks', () => {
    const ids = new Set(getBooks('fr').map(book => book.listingId));
    for (const slug of ['calendrier-avent-activites-enfants', 'jeux-enfants-restaurant-imprimer']) {
      const source = readFileSync(`src/content/blog/fr/${slug}.md`, 'utf8');
      expect(source).not.toContain('{{ETSY_');
      expect(source).toContain('data-shop-event="etsy_click"');
      expect(source).toContain('data-shop-event="book_sample_click"');
      for (const match of source.matchAll(/data-book-id="(\d+)"/g)) expect(ids.has(match[1])).toBe(true);
    }
    expect(readFileSync('src/pages/fr/blog/[slug].astro', 'utf8')).toContain('<ShopTracking />');
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
    expect(recommendedBook('vehicules', 'fr')?.id).toBe('trajet');
    expect(recommendedBook('noel', 'fr')?.id).toBe('noel');
    expect(recommendedBook('unknown', 'fr')).toBeUndefined();
  });
});
