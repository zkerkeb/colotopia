import { db } from '../db';
import { colorings } from '../db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { cdnPng } from './cdn';
import { normalizeTags, canonicalCategory, pairTranslations } from './catalog';
import { readFile } from 'node:fs/promises';
import aliases from '../data/coloring-aliases.json';
import stablePairs from '../data/translation-pairs.json';
import { optionalText } from './seo';

/**
 * Shape expected by every page and component.
 * Mirrors the old Astro content-collection entry so existing templates
 * keep working with `c.data.*` access.
 */
export interface ColoringData {
  title: string;
  slug: string;
  category: string;
  sourceCategory: string;
  audience: string;
  tags: string[];
  image: string;   // CDN PNG URL (full-size)
  alt: string;
  locale: string;
  seoTitle?: string;
  seoDescription?: string;
  printable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ColoringEntry {
  id: string;
  data: ColoringData;
}

/**
 * Returns publishable coloriages for a given locale.
 * Drop-in replacement for the old YAML-based version.
 */
const cache = new Map<string, Promise<ColoringEntry[]>>();
let flaggedPaths: Promise<Set<string>> | undefined;
export function getFlaggedColoringPaths(): Promise<Set<string>> {
  return flaggedPaths ??= (async () => {
    const snapshot = process.env.COLORING_SNAPSHOT;
    const rows: { locale: string; slug: string }[] = snapshot
      ? JSON.parse(await readFile(snapshot, 'utf8')).colorings.filter((row: { flagged: boolean }) => row.flagged)
      : await db.select({ locale: colorings.locale, slug: colorings.slug }).from(colorings).where(eq(colorings.flagged, true));
    return new Set(rows.map(row => `/${row.locale}/${row.locale === 'fr' ? 'coloriage' : 'coloring'}/${row.slug}/`));
  })().catch(error => { flaggedPaths = undefined; throw error; });
}
export function getPublishableColoriages(locale: 'fr' | 'en', preserveCategoryAliases = false): Promise<ColoringEntry[]> {
  if (!cache.has(locale)) cache.set(locale, loadColoriages(locale).catch(error => { cache.delete(locale); throw error; }));
  const result = cache.get(locale)!;
  return preserveCategoryAliases ? result.then(entries => entries.map(c => ({ ...c, data: { ...c.data, category: c.data.sourceCategory } }))) : result;
}

async function loadColoriages(locale: 'fr' | 'en'): Promise<ColoringEntry[]> {
  // Filter out flagged items: they are awaiting regeneration and should not
  // appear anywhere on the public site (listings, category pages, individual
  // [slug] pages → 404, search index, sitemap). Once regen-flagged.py unflags
  // them in DB, they reappear on the next build.
  // Explicit offline snapshot for local verification; production uses the DB.
  const snapshot = process.env.COLORING_SNAPSHOT;
  const rows: (typeof colorings.$inferSelect)[] = snapshot
    ? JSON.parse(await readFile(snapshot, 'utf8')).colorings.filter((row: typeof colorings.$inferSelect) => row.locale === locale && row.flagged === false)
    : await db
    .select()
    .from(colorings)
    .where(and(eq(colorings.locale, locale), eq(colorings.flagged, false)))
    .orderBy(desc(colorings.createdAt));

  // Keep the database and moderation history intact. Consolidation is a web
  // publication decision with explicit permanent redirects for the old URLs.
  const canonicalRows = rows.filter(row => locale !== 'en' || !Object.hasOwn(aliases, row.slug));
  for (const row of rows) {
    const targetSlug = locale === 'en' ? (aliases as Record<string, string>)[row.slug] : undefined;
    if (!targetSlug) continue;
    const target = canonicalRows.find(item => item.slug === targetSlug);
    if (!target || cdnPng(target.imagePath) !== cdnPng(row.imagePath)) throw new Error(`Review coloring alias before publication: ${row.slug} -> ${targetSlug}`);
  }
  return canonicalRows.map((row) => ({
    id: `${row.locale}/${row.slug}`,
    data: {
      title: row.title,
      slug: row.slug,
      category: canonicalCategory(row.categorySlug),
      sourceCategory: row.categorySlug,
      audience: row.audience,
      tags: normalizeTags(row.tagsJson),
      image: cdnPng(row.imagePath),
      alt: row.alt?.trim() || row.title,
      locale: row.locale,
      seoTitle: optionalText(row.seoTitle),
      seoDescription: optionalText(row.seoDescription),
      printable: row.printable,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
    },
  }));
}

/**
 * Builds a FR ↔ EN slug mapping using the shared image key.
 */
export async function buildSlugMap(): Promise<{
  frToEn: Record<string, string>;
  enToFr: Record<string, string>;
}> {
  const frPages = await getPublishableColoriages('fr');
  const enPages = await getPublishableColoriages('en');

  return pairTranslations(frPages.map(c => c.data), enPages.map(c => c.data), stablePairs);
}
