#!/usr/bin/env node
/**
 * Seed the colotopia PostgreSQL database from YAML content files.
 * Usage: node scripts/seed-db.mjs --approved-images path/to/reviewed-image-keys.json
 * DATABASE_URL is supplied by the local operator environment.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import yaml from 'js-yaml';
import { coloringKey, verifyPublishedArtwork, selectApprovedColorings } from './lib/coloring-assets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src/content/coloriages');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let database = pool;

async function seedCategories(colorings) {
  const categorySet = new Map();
  for (const c of colorings) {
    if (!categorySet.has(c.category)) {
      categorySet.set(c.category, {
        slug: c.category,
        nameFr: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        nameEn: c.category.charAt(0).toUpperCase() + c.category.slice(1),
      });
    }
  }

  const categories = [...categorySet.values()];
  console.log(`Seeding ${categories.length} categories...`);

  for (const cat of categories) {
    await database.query(
      `INSERT INTO categories (slug, name_fr, name_en) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      [cat.slug, cat.nameFr, cat.nameEn]
    );
  }
  return categories.length;
}

async function seedTags(colorings) {
  const tagSet = new Set();
  for (const c of colorings) {
    if (c.tags) {
      for (const t of c.tags) {
        tagSet.add(t);
      }
    }
  }

  const tags = [...tagSet];
  console.log(`Seeding ${tags.length} tags...`);

  for (const tag of tags) {
    await database.query(
      `INSERT INTO tags (slug, name_fr, name_en) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
      [tag, tag, tag]
    );
  }
  return tags.length;
}

async function seedColorings(colorings) {
  console.log(`Seeding ${colorings.length} colorings...`);
  let inserted = 0;

  for (const c of colorings) {
    const result = await database.query(
      `INSERT INTO colorings (slug, locale, title, category_slug, audience, image_path, alt, seo_title, seo_description, printable, tags_json, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (slug, locale) DO NOTHING
       RETURNING id`,
      [
        c.slug,
        c.locale,
        c.title,
        c.category,
        c.audience,
        coloringKey(c.image),
        c.alt || null,
        c.seoTitle || null,
        c.seoDescription || null,
        c.printable !== false,
        JSON.stringify(c.tags || []),
        c.createdAt ? new Date(c.createdAt) : new Date(),
      ]
    );
    if (result.rowCount > 0) inserted++;
  }
  return inserted;
}

async function loadYamlFiles(locale) {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml'));
  const colorings = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const data = yaml.load(content);
      if (data && data.slug) {
        colorings.push(data);
      }
    } catch (e) {
      console.warn(`Warning: failed to parse ${locale}/${file}: ${e.message}`);
    }
  }
  return colorings;
}

async function main() {
  console.log('Loading YAML files...');
  const fr = await loadYamlFiles('fr');
  const en = await loadYamlFiles('en');
  let loaded = [...fr, ...en];
  const selectionIndex = process.argv.indexOf('--approved-images');
  const selectionPath = process.argv[selectionIndex + 1];
  if (selectionIndex === -1 || !selectionPath) throw new Error('--approved-images requires a JSON file of visually reviewed image keys');
  loaded = selectApprovedColorings(loaded, JSON.parse(fs.readFileSync(selectionPath, 'utf8')));
  const existing = await pool.query('SELECT slug, locale FROM colorings');
  const existingKeys = new Set(existing.rows.map(row => `${row.locale}/${row.slug}`));
  const all = loaded.filter(row => !existingKeys.has(`${row.locale}/${row.slug}`));
  console.log(`Loaded ${loaded.length} colorings; ${all.length} new rows to verify`);

  // Verify every shared asset before inserting either locale. An upload failure
  // must never create publicly visible rows with missing files.
  for (const key of new Set(all.map(row => coloringKey(row.image)))) {
    await verifyPublishedArtwork(key);
  }
  database = await pool.connect();
  let catCount, tagCount, coloringCount;
  try {
    await database.query('BEGIN');
    catCount = await seedCategories(all);
    tagCount = await seedTags(all);
    coloringCount = await seedColorings(all);
    await database.query('COMMIT');
  } catch (error) {
    await database.query('ROLLBACK');
    throw error;
  } finally {
    database.release();
  }

  console.log(`\nDone:`);
  console.log(`  ${catCount} categories`);
  console.log(`  ${tagCount} tags`);
  console.log(`  ${coloringCount} colorings inserted`);

  await pool.end();
}

main().catch(e => {
  console.error(`Seed cancelled: ${e.message}`);
  process.exit(1);
});
