#!/usr/bin/env node
/**
 * Seed the local PostgreSQL database with production data.
 *
 * Usage:
 *   1. Start the local DB:  docker compose up -d
 *   2. Run this script:     node scripts/seed-local-db.mjs
 *
 * It reads scripts/seed-data.json (exported from prod) and populates
 * the categories, tags, and colorings tables.
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://colotopia:colotopia_local@localhost:5433/colotopia';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function run() {
  const data = JSON.parse(readFileSync(join(__dirname, 'seed-data.json'), 'utf-8'));

  console.log(`Seed data: ${data.categories.length} categories, ${data.tags.length} tags, ${data.colorings.length} colorings`);

  // Create tables if they don't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR NOT NULL UNIQUE,
      name_fr VARCHAR NOT NULL,
      name_en VARCHAR NOT NULL,
      icon_path TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS tags (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR NOT NULL UNIQUE,
      name_fr VARCHAR NOT NULL,
      name_en VARCHAR NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS colorings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR NOT NULL,
      locale VARCHAR NOT NULL,
      title VARCHAR NOT NULL,
      category_slug VARCHAR NOT NULL,
      audience VARCHAR NOT NULL,
      image_path TEXT NOT NULL,
      alt TEXT,
      seo_title VARCHAR,
      seo_description TEXT,
      printable BOOLEAN NOT NULL DEFAULT true,
      tags_json JSONB DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coloring_id UUID NOT NULL REFERENCES colorings(id),
      device_id VARCHAR,
      platform VARCHAR,
      downloaded_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `);

  // Clear existing data
  await pool.query('TRUNCATE downloads, colorings, tags, categories CASCADE');

  // Seed categories
  for (const c of data.categories) {
    await pool.query(
      `INSERT INTO categories (id, slug, name_fr, name_en, icon_path, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [c.id, c.slug, c.name_fr, c.name_en, c.icon_path, c.created_at]
    );
  }
  console.log(`✓ ${data.categories.length} categories inserted`);

  // Seed tags
  for (const t of data.tags) {
    await pool.query(
      `INSERT INTO tags (id, slug, name_fr, name_en, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [t.id, t.slug, t.name_fr, t.name_en, t.created_at]
    );
  }
  console.log(`✓ ${data.tags.length} tags inserted`);

  // Seed colorings
  for (const c of data.colorings) {
    await pool.query(
      `INSERT INTO colorings (id, slug, locale, title, category_slug, audience, image_path, alt, seo_title, seo_description, printable, tags_json, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [c.id, c.slug, c.locale, c.title, c.category_slug, c.audience, c.image_path, c.alt, c.seo_title, c.seo_description, c.printable, JSON.stringify(c.tags_json), c.created_at, c.updated_at]
    );
  }
  console.log(`✓ ${data.colorings.length} colorings inserted`);

  console.log('\n🎉 Local database seeded successfully!');
  await pool.end();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
