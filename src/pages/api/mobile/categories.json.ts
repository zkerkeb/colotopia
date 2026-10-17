import { readFile } from 'node:fs/promises';
/**
 * Mobile API endpoint — returns all categories with icons.
 *
 * GET /api/mobile/categories.json
 */
import { db } from '../../../db';
import { categories } from '../../../db/schema';
import { colorings } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { cdnCategoryIcon } from '../../../lib/cdn';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Get categories with counts
  // Preserve the API contract; local builds may use an explicit read-only snapshot.
  const rows: { slug: string; nameFr: string; nameEn: string; iconPath: string | null; count: number }[] = process.env.COLORING_SNAPSHOT
    ? JSON.parse(await readFile(process.env.COLORING_SNAPSHOT, 'utf8')).categories
    : await db
    .select({
      slug: categories.slug,
      nameFr: categories.nameFr,
      nameEn: categories.nameEn,
      iconPath: categories.iconPath,
      count: sql<number>`(
        SELECT COUNT(*) FROM colorings
        WHERE colorings.category_slug = ${categories.slug}
        AND colorings.locale = 'fr'
      )`,
    })
    .from(categories);

  const result = rows
    .filter((r) => Number(r.count) > 0)
    .map((r) => ({
      slug: r.slug,
      name: r.nameFr,
      nameEn: r.nameEn,
      icon: cdnCategoryIcon(r.slug),
      count: Number(r.count),
    }))
    .sort((a, b) => b.count - a.count);

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
