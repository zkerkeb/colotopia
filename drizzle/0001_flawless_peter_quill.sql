ALTER TABLE "colorings" DROP CONSTRAINT "colorings_slug_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_colorings_slug_locale" ON "colorings" USING btree ("slug","locale");