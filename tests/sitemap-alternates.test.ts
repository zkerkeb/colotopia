import { describe, it, expect, beforeAll } from 'vitest';
import { getAlternateUrl } from '../src/lib/sitemap-alternates';

const SITE = 'https://colotopia.com';

// getAlternateUrl loads slug maps from disk on first call — that's fine, the
// content files exist in the repo so the mapping will be populated.

describe('getAlternateUrl — FR pages', () => {
  it('maps FR home to EN home', () => {
    const result = getAlternateUrl(`${SITE}/fr/`);
    expect(result).toEqual({ locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/` });
  });

  it('maps FR paginated home to EN paginated home', () => {
    const result = getAlternateUrl(`${SITE}/fr/2/`);
    expect(result).toEqual({ locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/2/` });
  });

  it('maps FR category to EN category', () => {
    const result = getAlternateUrl(`${SITE}/fr/animaux/`);
    expect(result).toEqual({
      locale: 'fr',
      altLocale: 'en',
      altUrl: `${SITE}/en/animals/`,
    });
  });

  it('maps FR paginated category to EN paginated category', () => {
    const result = getAlternateUrl(`${SITE}/fr/animaux/2/`);
    expect(result).toEqual({
      locale: 'fr',
      altLocale: 'en',
      altUrl: `${SITE}/en/animals/2/`,
    });
  });

  it('maps FR legal pages correctly', () => {
    expect(getAlternateUrl(`${SITE}/fr/confidentialite/`)).toEqual({
      locale: 'fr',
      altLocale: 'en',
      altUrl: `${SITE}/en/privacy/`,
    });
    expect(getAlternateUrl(`${SITE}/fr/conditions/`)).toEqual({
      locale: 'fr',
      altLocale: 'en',
      altUrl: `${SITE}/en/terms/`,
    });
  });

  it('maps FR coloring page to EN coloring page', () => {
    const result = getAlternateUrl(`${SITE}/fr/coloriage/ferme-cochon/`);
    expect(result).not.toBeNull();
    expect(result!.locale).toBe('fr');
    expect(result!.altLocale).toBe('en');
    expect(result!.altUrl).toMatch(/\/en\/coloring\//);
  });
});

describe('getAlternateUrl — EN pages', () => {
  it('maps EN home to FR home', () => {
    const result = getAlternateUrl(`${SITE}/en/`);
    expect(result).toEqual({ locale: 'en', altLocale: 'fr', altUrl: `${SITE}/fr/` });
  });

  it('maps EN category to FR category', () => {
    const result = getAlternateUrl(`${SITE}/en/animals/`);
    expect(result).toEqual({
      locale: 'en',
      altLocale: 'fr',
      altUrl: `${SITE}/fr/animaux/`,
    });
  });

  it('maps EN legal pages correctly', () => {
    expect(getAlternateUrl(`${SITE}/en/privacy/`)).toEqual({
      locale: 'en',
      altLocale: 'fr',
      altUrl: `${SITE}/fr/confidentialite/`,
    });
    expect(getAlternateUrl(`${SITE}/en/terms/`)).toEqual({
      locale: 'en',
      altLocale: 'fr',
      altUrl: `${SITE}/fr/conditions/`,
    });
  });

  it('maps EN coloring page to FR coloring page', () => {
    const result = getAlternateUrl(`${SITE}/en/coloring/farm-pig/`);
    expect(result).not.toBeNull();
    expect(result!.locale).toBe('en');
    expect(result!.altLocale).toBe('fr');
    expect(result!.altUrl).toMatch(/\/fr\/coloriage\//);
  });
});

describe('getAlternateUrl — category coverage', () => {
  const categoryPairs: [string, string][] = [
    ['animaux', 'animals'],
    ['animaux-marins', 'sea-animals'],
    ['ferme', 'farm'],
    ['vehicules', 'vehicles'],
    ['nature', 'nature'],
    ['dinosaures', 'dinosaurs'],
    ['super-heros', 'superheroes'],
    ['espace', 'space'],
    ['princesses-chevaliers', 'princesses-knights'],
    ['mandalas', 'mandalas'],
    ['mosaiques', 'mosaics'],
    ['abstrait', 'abstract'],
    ['paysages', 'landscapes'],
  ];

  for (const [fr, en] of categoryPairs) {
    it(`FR /${fr}/ → EN /${en}/`, () => {
      const result = getAlternateUrl(`${SITE}/fr/${fr}/`);
      expect(result).toEqual({
        locale: 'fr',
        altLocale: 'en',
        altUrl: `${SITE}/en/${en}/`,
      });
    });

    it(`EN /${en}/ → FR /${fr}/`, () => {
      const result = getAlternateUrl(`${SITE}/en/${en}/`);
      expect(result).toEqual({
        locale: 'en',
        altLocale: 'fr',
        altUrl: `${SITE}/fr/${fr}/`,
      });
    });
  }
});

describe('getAlternateUrl — edge cases', () => {
  it('returns alternate for root URL', () => {
    const result = getAlternateUrl(`${SITE}/`);
    expect(result).toEqual({ locale: 'fr', altLocale: 'en', altUrl: `${SITE}/en/` });
  });

  it('returns null for unrecognized paths', () => {
    const result = getAlternateUrl(`${SITE}/de/something/`);
    expect(result).toBeNull();
  });
});
