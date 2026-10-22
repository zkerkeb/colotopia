import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import sharp from "sharp";
import { jsPDF } from "jspdf";
import { fitA4 } from "./pdf";

/** Build once, from full-resolution published masters. A download needs no JavaScript. */
export async function collectionPdf(
  items: { data: { image: string; updatedAt?: string } }[],
  title: string,
) {
  if (!items.length) throw new Error("Cannot publish an empty coloring pack");
  const cache = resolve("node_modules/.astro/assets/colotopia-packs-v1");
  await mkdir(cache, { recursive: true });
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });
  for (const [index, item] of items.entries()) {
    const { image, updatedAt } = item.data;
    if (new URL(image).origin !== "https://cdn.colotopia.com")
      throw new Error("Unexpected pack image origin");
    const key = createHash("sha256")
      .update(image + updatedAt)
      .digest("hex");
    const path = resolve(cache, `${key}.png`);
    let data: Buffer;
    try {
      data = await readFile(path);
    } catch {
      let downloaded: Buffer | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(image, {
            signal: AbortSignal.timeout(60_000),
          });
          if (!response.ok)
            throw new Error(`Pack image HTTP ${response.status}`);
          downloaded = Buffer.from(await response.arrayBuffer());
          await sharp(downloaded).metadata();
          break;
        } catch (error) {
          if (attempt === 2) throw error;
        }
      }
      data = downloaded!;
      await writeFile(path, data);
    }
    const { data: jpeg, info } = await sharp(data)
      .flatten({ background: "#fff" })
      .jpeg({ quality: 97, chromaSubsampling: "4:4:4" })
      .toBuffer({ resolveWithObject: true });
    if (info.width < 1000 || info.height < 1000)
      throw new Error("Pack master resolution too low");
    if (index > 0) doc.addPage();
    const box = fitA4(info.width, info.height);
    doc.addImage(
      new Uint8Array(jpeg),
      "JPEG",
      box.x,
      box.y,
      box.width,
      box.height,
    );
  }
  doc.setProperties({
    title,
    creator: "Colotopia",
    subject: "Coloriages / Coloring pages - A4",
  });
  return new Uint8Array(doc.output("arraybuffer"));
}
