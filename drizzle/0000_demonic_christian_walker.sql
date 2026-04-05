CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name_fr" varchar(200) NOT NULL,
	"name_en" varchar(200) NOT NULL,
	"icon_path" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "colorings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"locale" varchar(5) NOT NULL,
	"title" varchar(300) NOT NULL,
	"category_slug" varchar(100) NOT NULL,
	"audience" varchar(50) NOT NULL,
	"image_path" text NOT NULL,
	"alt" text,
	"seo_title" varchar(300),
	"seo_description" text,
	"printable" boolean DEFAULT true NOT NULL,
	"tags_json" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "colorings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coloring_id" uuid NOT NULL,
	"device_id" varchar(255),
	"platform" varchar(20),
	"downloaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name_fr" varchar(200) NOT NULL,
	"name_en" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_coloring_id_colorings_id_fk" FOREIGN KEY ("coloring_id") REFERENCES "public"."colorings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_colorings_locale" ON "colorings" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "idx_colorings_category" ON "colorings" USING btree ("category_slug");--> statement-breakpoint
CREATE INDEX "idx_colorings_audience" ON "colorings" USING btree ("audience");--> statement-breakpoint
CREATE INDEX "idx_downloads_coloring" ON "downloads" USING btree ("coloring_id");--> statement-breakpoint
CREATE INDEX "idx_downloads_device" ON "downloads" USING btree ("device_id");