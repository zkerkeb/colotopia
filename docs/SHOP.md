# Boutique Colotopia

Published Etsy listings verified on 2026-10-31 (owner's shop `Colotopia`). Source of truth: `src/lib/shop.ts`. Four listings, three book families. FR/EN woodland pages select the corresponding edition; coloring books share one listing with French introductory text and page titles. No checkout, payment secrets or customer data on this site.

## Assets

Approved source directory on the owner's Mac: `/Users/hikkary/Documents/Codex/2026-10-28/e39/outputs/`.

- `colotopia-etsy-boutique/miniature-{enfants,adultes}-carree.png`: coloring book presentations.
- `colotopia-livres-amazon/{enfants,adultes}/visuels/02-apercus-numeriques.png`: inside previews.
- `colotopia-v1/visuels/Etsy_{FR,EN}-{1,2}.png`: activity book presentations and previews.
- Only the two coloring `Extrait-gratuit-6p.pdf` files and `colotopia-v1/lancement/Extrait-gratuit-{FR,EN}-6pages.pdf` are copied to `public/downloads/shop/`. Full products remain private on Etsy.
- Cards also use the existing woodland cover illustration (`sources/assets/forest-cover.png`) and pages 2–4 rendered from the two free coloring excerpts. No full paid PDF is rendered or published.
- WebP assets resized/compressed from originals; no new drawings generated.

A4/US Letter contain identical content. 60 total pages/48 activity pages for woodland; 52 total pages/50 drawings for coloring books. License: one household or classroom, no redistribution/resale.

## Prices and availability

Seller price observed: USD 3.48. French Etsy display observed: EUR 3.90 including applicable French VAT. EUR is explicitly approximate; Etsy is authoritative for final price, exchange rates and taxes. No stale Offer/availability structured data. Recheck links, active status and indicative prices if the Etsy catalog changes; listings currently expire manually on 2027-02-28.

## Measurement

`book_click` = navigation to a book (home/shop/coloring placement), `book_view` = product page viewed, `book_sample_click` = request for a free sample, `etsy_click` = outbound click. All use the existing analytics consent and internal-traffic exclusion. A sample click does not prove the file was saved; an Etsy click is **not** a purchase. Sales are confirmed in Etsy, not inferred in GA4. No extra cookies or third-party tracking script.

## Experiment

2026-10-31: add books after the free featured drawings and one relevant recommendation below free download actions. Hypothesis: visitors who enjoy a free page can discover a useful paid book without blocking their original task. Follow free PDF downloads, product clicks, sample requests, Etsy clicks and actual Etsy orders. Keep low counts and QA traffic separate; do not infer uplift without enough observations. Existing SEO content and collections remain available.

## Validation before release

2026-10-31: 134 tests; Astro type check without errors; full static build and verifier without errors (5,929 HTML pages including redirects, 526,688 links, 10,876 alternates). Targeted HTTP validation: 13 pages, 86 assets, 75 fully decoded images and four PDFs matching the approved free excerpts. Browser review at desktop, 820 px, 390 px and 320 px. Compiled free PDF action reaches the ready state. Etsy destination checked without purchasing. Final currency/text wording is also checked in the production build and release readback.
