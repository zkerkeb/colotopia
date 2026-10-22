import { createHash } from "node:crypto";
import { getPublishableColoriages, buildSlugMap } from "./coloriages";
import type { Locale } from "./i18n";

export const collectionDefinitions = [
  {
    id: "beginners",
    category: "bold-et-facile",
    color: "#e0f7eb",
    fr: {
      slug: "gros-traits-pour-debuter",
      title: "Gros traits pour débuter",
      short: "Pour débuter",
      description:
        "Des contours marqués, de grandes formes et peu de détails : une sélection de coloriages simples à imprimer ensemble ou feuille par feuille.",
      tips: [
        "Commence par le soleil ou la fleur : leurs grandes formes laissent de la place aux couleurs.",
        "Choisis ensuite un animal. Tu peux garder une seule couleur ou en essayer plusieurs.",
        "Utilise des crayons ou des feutres adaptés à ton papier, et protège la table.",
      ],
    },
    en: {
      slug: "bold-easy-beginners",
      title: "Bold and easy coloring pages",
      short: "A simple place to start",
      description:
        "Bold outlines, large shapes and few details: a selection of simple coloring pages to print together or one sheet at a time.",
      tips: [
        "Start with the sun or flower: their large shapes leave plenty of space for color.",
        "Then choose an animal. Try a single color or mix several.",
        "Choose pencils or markers suited to your paper, and protect the table.",
      ],
    },
    slugs: [
      "ours",
      "chien",
      "fleur",
      "papillon",
      "soleil",
      "baleine",
      "dinosaure",
      "licorne",
    ].map((s) => `bold-et-facile-${s}`),
  },
  {
    id: "dinosaurs",
    category: "dinosaures",
    color: "#ece4fc",
    fr: {
      slug: "dinosaures-faciles",
      title: "Dinosaures faciles à colorier",
      short: "Dinosaures faciles",
      description:
        "Bébés dinosaures, œufs et grands herbivores : des dessins aux formes arrondies pour inventer un petit monde préhistorique en couleurs.",
      tips: [
        "Commence par un bébé dinosaure, puis essaie un dessin avec un décor.",
        "Les couleurs sont libres : invente un dinosaure vert, violet ou multicolore.",
        "Après le coloriage, donne un nom à ton dinosaure et imagine son aventure. Ces dessins sont fantaisistes, pas des planches scientifiques.",
      ],
    },
    en: {
      slug: "easy-dinosaurs",
      title: "Easy dinosaur coloring pages",
      short: "Easy dinosaurs",
      description:
        "Baby dinosaurs, eggs and big plant-eaters: rounded shapes to create your own colorful prehistoric world.",
      tips: [
        "Start with a baby dinosaur, then try a drawing with a background.",
        "Choose any colors: make a green, purple or rainbow dinosaur.",
        "Give your dinosaur a name and invent an adventure. These are playful illustrations, not scientific diagrams.",
      ],
    },
    slugs: [
      "bebe-trex",
      "kawaii-mignon",
      "bebe-dino",
      "oeuf-eclosion",
      "bebe-eclosion",
      "stegosaurus",
      "brontosaure",
    ]
      .map((s) => `dinosaures-${s}`)
      .concat(["bold-et-facile-dinosaure"]),
  },
  {
    id: "christmas",
    category: "noel",
    color: "#ffe8f0",
    fr: {
      slug: "noel-a-colorier",
      title: "Un Noël à colorier",
      short: "Un Noël à colorier",
      description:
        "Sapin, renne, Père Noël et décorations : prépare une activité de fête avec un petit cahier de coloriages de Noël gratuit au format A4.",
      tips: [
        "Choisis les dessins avant d’imprimer : le PDF permet aussi de sélectionner seulement certaines pages.",
        "Essaie une palette rouge et verte, ou invente ton Noël bleu et doré.",
        "Accroche tes feuilles terminées ou plie-les pour en faire des cartes. Pour le découpage, demande de l’aide si nécessaire.",
      ],
    },
    en: {
      slug: "christmas-coloring-pack",
      title: "A Christmas coloring collection",
      short: "A Christmas to color",
      description:
        "A tree, a reindeer, Santa and decorations: plan a festive activity with a free A4 Christmas coloring booklet.",
      tips: [
        "Choose before printing: your PDF viewer can print only selected pages.",
        "Try a red and green palette, or invent a blue and gold Christmas.",
        "Display the finished pages or fold them into cards. Ask for help with cutting if needed.",
      ],
    },
    slugs: [
      "renne-rudolf",
      "sapin-decore",
      "pere-noel",
      "bonhomme-neige",
      "lutin-atelier",
      "bas-cadeaux",
      "couronne-houx",
      "bonbon-canne",
    ].map((s) => `noel-${s}`),
  },
] as const;

/** Keep the editorial order and omit entries withdrawn from publication. */
export function selectCollectionItems<
  T extends { data: { slug: string; image: string; updatedAt?: string } },
>(slugs: readonly string[], entries: T[]) {
  const bySlug = new Map(entries.map((c) => [c.data.slug, c]));
  return slugs.map((slug) => bySlug.get(slug)).filter((c): c is T => !!c);
}

export async function getCollections(locale: Locale) {
  if (!collectionCache.has(locale))
    collectionCache.set(
      locale,
      loadCollections(locale).catch((error) => {
        collectionCache.delete(locale);
        throw error;
      }),
    );
  return collectionCache.get(locale)!;
}
const collectionCache = new Map<Locale, ReturnType<typeof loadCollections>>();
async function loadCollections(locale: Locale) {
  const [fr, local, pairs] = await Promise.all([
    getPublishableColoriages("fr"),
    getPublishableColoriages(locale),
    buildSlugMap(),
  ]);
  return collectionDefinitions.map((def) => {
    // Require both translations to be public; a flagged drawing is removed from both packs.
    const approved = def.slugs.filter(
      (slug) => fr.some((c) => c.data.slug === slug) && pairs.frToEn[slug],
    );
    const items = selectCollectionItems(
      approved.map((slug) => (locale === "fr" ? slug : pairs.frToEn[slug])),
      local,
    );
    const version = createHash("sha256")
      .update(
        JSON.stringify(
          selectCollectionItems(approved, fr).map((c) => [
            c.data.image,
            c.data.updatedAt,
          ]),
        ),
      )
      .digest("hex")
      .slice(0, 12);
    return {
      ...def,
      ...def[locale],
      items,
      href: `/${locale}/collections/${def[locale].slug}/`,
      pdf: `/packs/${def.id}-${version}.pdf`,
      version,
    };
  });
}
