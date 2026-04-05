import { pgTable, uuid, text, varchar, boolean, timestamp, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  nameFr: varchar('name_fr', { length: 200 }).notNull(),
  nameEn: varchar('name_en', { length: 200 }).notNull(),
  iconPath: text('icon_path'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  nameFr: varchar('name_fr', { length: 200 }).notNull(),
  nameEn: varchar('name_en', { length: 200 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Colorings table (main catalogue)
export const colorings = pgTable('colorings', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 200 }).notNull(),
  locale: varchar('locale', { length: 5 }).notNull(), // 'fr' or 'en'
  title: varchar('title', { length: 300 }).notNull(),
  categorySlug: varchar('category_slug', { length: 100 }).notNull(),
  audience: varchar('audience', { length: 50 }).notNull(), // 'enfants', 'adultes', etc.
  imagePath: text('image_path').notNull(), // R2 URL or relative path
  alt: text('alt'),
  seoTitle: varchar('seo_title', { length: 300 }),
  seoDescription: text('seo_description'),
  printable: boolean('printable').default(true).notNull(),
  tagsJson: jsonb('tags_json').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_colorings_slug_locale').on(table.slug, table.locale),
  index('idx_colorings_locale').on(table.locale),
  index('idx_colorings_category').on(table.categorySlug),
  index('idx_colorings_audience').on(table.audience),
]);

// Downloads tracking (anonymous, by RevenueCat device ID)
export const downloads = pgTable('downloads', {
  id: uuid('id').defaultRandom().primaryKey(),
  coloringId: uuid('coloring_id').notNull().references(() => colorings.id),
  deviceId: varchar('device_id', { length: 255 }), // RevenueCat anonymous device ID
  platform: varchar('platform', { length: 20 }), // 'ios', 'android', 'web'
  downloadedAt: timestamp('downloaded_at').defaultNow().notNull(),
}, (table) => [
  index('idx_downloads_coloring').on(table.coloringId),
  index('idx_downloads_device').on(table.deviceId),
]);
