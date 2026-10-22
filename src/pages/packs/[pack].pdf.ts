import type { APIRoute, GetStaticPaths } from "astro";
import { getCollections } from "../../lib/collections";
import { collectionPdf } from "../../lib/collection-pdf";
export const getStaticPaths: GetStaticPaths = async () =>
  (await getCollections("fr"))
    .filter((c) => c.items.length)
    .map((collection) => ({
      params: { pack: `${collection.id}-${collection.version}` },
      props: { collection },
    }));
export const GET: APIRoute = async ({ props }) =>
  new Response(
    await collectionPdf(
      props.collection.items,
      `${props.collection.fr.title} / ${props.collection.en.title}`,
    ),
    {
      headers: { "Content-Type": "application/pdf", "X-Robots-Tag": "noindex" },
    },
  );
