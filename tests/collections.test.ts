import { describe, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  fr: [] as any[],
  en: [] as any[],
  pairs: {} as Record<string, string>,
}));
vi.mock("../src/lib/coloriages", () => ({
  getPublishableColoriages: async (locale: string) =>
    state[locale as "fr" | "en"],
  buildSlugMap: async () => ({ frToEn: state.pairs, enToFr: {} }),
}));
function entry(slug: string, image: string, updatedAt = "2026-10-22") {
  return { data: { slug, image, updatedAt } };
}
describe("editorial collection publication", () => {
  it("keeps the selected order, omits withdrawn pages and shares the same pack across locales", async () => {
    vi.resetModules();
    state.fr = [
      entry("bold-et-facile-chien", "dog"),
      entry("bold-et-facile-ours", "bear"),
    ];
    state.en = [
      entry("bear", "bear", "2026-10-21"),
      entry("dog", "dog", "2026-10-20"),
    ];
    state.pairs = {
      "bold-et-facile-ours": "bear",
      "bold-et-facile-chien": "dog",
    };
    const { getCollections } = await import("../src/lib/collections");
    const fr = (await getCollections("fr"))[0],
      en = (await getCollections("en"))[0];
    expect(fr.items.map((i) => i.data.slug)).toEqual([
      "bold-et-facile-ours",
      "bold-et-facile-chien",
    ]);
    expect(en.items.map((i) => i.data.slug)).toEqual(["bear", "dog"]);
    expect(fr.pdf).toBe(en.pdf);
    expect(fr.items).toHaveLength(2);
  });
  it("withdraws a missing translation from both packs and changes the download URL", async () => {
    vi.resetModules();
    state.pairs = { "bold-et-facile-ours": "bear" };
    const { getCollections } = await import("../src/lib/collections");
    const fr = (await getCollections("fr"))[0],
      en = (await getCollections("en"))[0];
    expect(fr.items.map((i) => i.data.slug)).toEqual(["bold-et-facile-ours"]);
    expect(en.items.map((i) => i.data.slug)).toEqual(["bear"]);
    expect(fr.pdf).toBe(en.pdf);
    const before = fr.pdf;
    vi.resetModules();
    state.fr = [entry("bold-et-facile-ours", "new-bear-master")];
    const after = (
      await (await import("../src/lib/collections")).getCollections("fr")
    )[0];
    expect(after.pdf).not.toBe(before);
  });
});
