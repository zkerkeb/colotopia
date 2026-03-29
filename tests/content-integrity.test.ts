import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { categories } from '../src/lib/i18n';

const CONTENT_DIR = join(process.cwd(), 'src', 'content', 'coloriages');
const PUBLIC_DIR = join(process.cwd(), 'public');

const validCategories = new Set<string>(categories);
const validAudiences = new Set(['enfants', 'adultes']);
const validLocales = new Set(['fr', 'en']);

interface YamlEntry {
  file: string;
  title?: string;
  slug?: string;
  category?: string;
  audience?: string;
  image?: string;
  alt?: string;
  locale?: string;
  tags?: string;
}

function parseYaml(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      result[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

function loadAllYamlEntries(): YamlEntry[] {
  const entries: YamlEntry[] = [];

  function scanDir(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(path);
      } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        const raw = readFileSync(path, 'utf-8');
        const data = parseYaml(raw);
        entries.push({ file: path, ...data });
      }
    }
  }

  scanDir(CONTENT_DIR);
  return entries;
}

describe('content YAML integrity', () => {
  const entries = loadAllYamlEntries();

  it('has content files', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('every entry has required fields: title, slug, category, image, alt, locale', () => {
    const missingFields: string[] = [];
    for (const e of entries) {
      const missing: string[] = [];
      if (!e.title) missing.push('title');
      if (!e.slug) missing.push('slug');
      if (!e.category) missing.push('category');
      if (!e.image) missing.push('image');
      if (!e.alt) missing.push('alt');
      if (!e.locale) missing.push('locale');
      if (missing.length > 0) {
        missingFields.push(`${e.file}: missing ${missing.join(', ')}`);
      }
    }
    expect(missingFields).toEqual([]);
  });

  it('every entry uses a valid category', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      if (e.category && !validCategories.has(e.category)) {
        invalid.push(`${e.file}: invalid category "${e.category}"`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('every entry uses a valid locale (fr or en)', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      if (e.locale && !validLocales.has(e.locale)) {
        invalid.push(`${e.file}: invalid locale "${e.locale}"`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('every entry uses a valid audience', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      if (e.audience && !validAudiences.has(e.audience)) {
        invalid.push(`${e.file}: invalid audience "${e.audience}"`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('no duplicate slugs within the same locale', () => {
    const seen: Record<string, string[]> = {};
    for (const e of entries) {
      if (e.slug && e.locale) {
        const key = `${e.locale}/${e.slug}`;
        if (!seen[key]) seen[key] = [];
        seen[key].push(e.file);
      }
    }
    const dupes = Object.entries(seen).filter(([, files]) => files.length > 1);
    if (dupes.length > 0) {
      const details = dupes.map(([key, files]) => `${key}: ${files.join(', ')}`);
      expect(details).toEqual([]);
    }
  });

  it('every image path points to a file that exists on disk', () => {
    const missing: string[] = [];
    for (const e of entries) {
      if (e.image) {
        const imagePath = join(PUBLIC_DIR, e.image);
        const webpPath = imagePath.replace(/\.png$/, '.webp');
        if (!existsSync(imagePath) && !existsSync(webpPath)) {
          missing.push(`${e.file}: image not found at ${e.image}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('every image has a corresponding thumbnail', () => {
    const missing: string[] = [];
    for (const e of entries) {
      if (e.image) {
        const thumbPath = join(PUBLIC_DIR, e.image)
          .replace('/images/coloriages/', '/images/coloriages/thumbs/')
          .replace(/\.png$/, '.webp');
        if (!existsSync(thumbPath)) {
          missing.push(`${e.file}: thumbnail not found for ${e.image}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('FR/EN content pairing', () => {
  const entries = loadAllYamlEntries();
  const frEntries = entries.filter((e) => e.locale === 'fr');
  const enEntries = entries.filter((e) => e.locale === 'en');

  it('has both FR and EN content', () => {
    expect(frEntries.length).toBeGreaterThan(0);
    expect(enEntries.length).toBeGreaterThan(0);
  });

  it('FR and EN entries sharing an image path have matching categories', () => {
    const frByImage: Record<string, YamlEntry> = {};
    for (const e of frEntries) {
      if (e.image) frByImage[e.image] = e;
    }

    const mismatches: string[] = [];
    for (const e of enEntries) {
      if (e.image && frByImage[e.image]) {
        const fr = frByImage[e.image];
        if (fr.category !== e.category) {
          mismatches.push(
            `image ${e.image}: FR category="${fr.category}" vs EN category="${e.category}"`
          );
        }
      }
    }
    expect(mismatches).toEqual([]);
  });
});
