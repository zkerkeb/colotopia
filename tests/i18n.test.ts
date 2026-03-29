import { describe, it, expect } from 'vitest';
import {
  t,
  ti,
  getCategoryLabel,
  getCategorySlug,
  getLocalePath,
  getColoringBasePath,
  getPrivacyPath,
  getTermsPath,
  getCategoriesPath,
  categories,
  kidsCategories,
  adultCategories,
  categoryIcons,
  categoryColors,
  type Category,
  type Locale,
} from '../src/lib/i18n';

// ---------------------------------------------------------------------------
// Data consistency — every category must have icon, color, label, and EN slug
// ---------------------------------------------------------------------------
describe('category data consistency', () => {
  const allCategories = [...categories];

  it('every category has an icon', () => {
    for (const cat of allCategories) {
      expect(categoryIcons[cat], `missing icon for "${cat}"`).toBeDefined();
      expect(categoryIcons[cat].length).toBeGreaterThan(0);
    }
  });

  it('every category has colors (bg, light, text, gradient)', () => {
    for (const cat of allCategories) {
      const color = categoryColors[cat];
      expect(color, `missing colors for "${cat}"`).toBeDefined();
      expect(color.bg).toBeTruthy();
      expect(color.light).toBeTruthy();
      expect(color.text).toBeTruthy();
      expect(color.gradient).toBeTruthy();
    }
  });

  it('every category has a French label', () => {
    for (const cat of allCategories) {
      const label = getCategoryLabel(cat, 'fr');
      expect(label, `missing FR label for "${cat}"`).not.toBe(`category.${cat}`);
    }
  });

  it('every category has an English label', () => {
    for (const cat of allCategories) {
      const label = getCategoryLabel(cat, 'en');
      expect(label, `missing EN label for "${cat}"`).not.toBe(`category.${cat}`);
    }
  });

  it('every category has an English slug', () => {
    for (const cat of allCategories) {
      const slug = getCategorySlug(cat, 'en');
      expect(slug, `missing EN slug for "${cat}"`).toBeDefined();
      expect(slug.length).toBeGreaterThan(0);
    }
  });

  it('kids and adult categories are disjoint', () => {
    const kidsSet = new Set<string>(kidsCategories);
    const adultsSet = new Set<string>(adultCategories);
    const overlap = [...kidsSet].filter((c) => adultsSet.has(c));
    expect(overlap).toEqual([]);
  });

  it('categories = kids + adults combined', () => {
    expect(allCategories).toEqual([...kidsCategories, ...adultCategories]);
  });
});

// ---------------------------------------------------------------------------
// t() — translation lookup
// ---------------------------------------------------------------------------
describe('t()', () => {
  it('returns the French translation for a known key', () => {
    expect(t('nav.home', 'fr')).toBe('Accueil');
  });

  it('returns the English translation for a known key', () => {
    expect(t('nav.home', 'en')).toBe('Home');
  });

  it('returns the key itself when the key does not exist', () => {
    expect(t('nonexistent.key', 'fr')).toBe('nonexistent.key');
  });
});

// ---------------------------------------------------------------------------
// ti() — translation with interpolation
// ---------------------------------------------------------------------------
describe('ti()', () => {
  it('replaces placeholders with provided values', () => {
    const result = ti('category.description', 'fr', { label: 'Animaux' });
    expect(result).toContain('Animaux');
    expect(result).not.toContain('{label}');
  });
});

// ---------------------------------------------------------------------------
// getCategoryLabel()
// ---------------------------------------------------------------------------
describe('getCategoryLabel()', () => {
  it('returns "Animaux" for animaux in FR', () => {
    expect(getCategoryLabel('animaux', 'fr')).toBe('Animaux');
  });

  it('returns "Animals" for animaux in EN', () => {
    expect(getCategoryLabel('animaux', 'en')).toBe('Animals');
  });
});

// ---------------------------------------------------------------------------
// getCategorySlug()
// ---------------------------------------------------------------------------
describe('getCategorySlug()', () => {
  it('returns the FR category key as-is for French locale', () => {
    expect(getCategorySlug('animaux', 'fr')).toBe('animaux');
    expect(getCategorySlug('super-heros', 'fr')).toBe('super-heros');
  });

  it('returns the English slug for English locale', () => {
    expect(getCategorySlug('animaux', 'en')).toBe('animals');
    expect(getCategorySlug('super-heros', 'en')).toBe('superheroes');
    expect(getCategorySlug('princesses-chevaliers', 'en')).toBe('princesses-knights');
  });

  it('maps all categories to distinct EN slugs (no collisions)', () => {
    const allCategories = [...categories];
    const enSlugs = allCategories.map((c) => getCategorySlug(c, 'en'));
    const uniqueSlugs = new Set(enSlugs);
    expect(uniqueSlugs.size).toBe(allCategories.length);
  });
});

// ---------------------------------------------------------------------------
// getLocalePath()
// ---------------------------------------------------------------------------
describe('getLocalePath()', () => {
  it('returns /fr for French with no path', () => {
    expect(getLocalePath('fr')).toBe('/fr');
  });

  it('returns /en for English with no path', () => {
    expect(getLocalePath('en')).toBe('/en');
  });

  it('appends path correctly', () => {
    expect(getLocalePath('fr', '/categories')).toBe('/fr/categories');
  });
});

// ---------------------------------------------------------------------------
// getColoringBasePath()
// ---------------------------------------------------------------------------
describe('getColoringBasePath()', () => {
  it('returns "coloriage" for FR', () => {
    expect(getColoringBasePath('fr')).toBe('coloriage');
  });

  it('returns "coloring" for EN', () => {
    expect(getColoringBasePath('en')).toBe('coloring');
  });
});

// ---------------------------------------------------------------------------
// Legal and navigation paths
// ---------------------------------------------------------------------------
describe('legal paths', () => {
  it('getPrivacyPath returns correct FR path', () => {
    expect(getPrivacyPath('fr')).toBe('/fr/confidentialite');
  });

  it('getPrivacyPath returns correct EN path', () => {
    expect(getPrivacyPath('en')).toBe('/en/privacy');
  });

  it('getTermsPath returns correct FR path', () => {
    expect(getTermsPath('fr')).toBe('/fr/conditions');
  });

  it('getTermsPath returns correct EN path', () => {
    expect(getTermsPath('en')).toBe('/en/terms');
  });

  it('getCategoriesPath returns correct paths', () => {
    expect(getCategoriesPath('fr')).toBe('/fr/categories');
    expect(getCategoriesPath('en')).toBe('/en/categories');
  });
});
