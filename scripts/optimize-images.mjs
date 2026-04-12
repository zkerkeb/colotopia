import { fileURLToPath } from 'url';
import { basename, dirname, join, resolve } from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Auto-detect project root by looking for astro.config.mjs
async function findProjectRoot(startPath) {
  let currentPath = startPath;
  while (currentPath !== '/') {
    try {
      await fs.access(join(currentPath, 'astro.config.mjs'));
      return currentPath;
    } catch {
      currentPath = dirname(currentPath);
    }
  }
  throw new Error('Could not find project root (astro.config.mjs not found)');
}

// Get file stats, returning null if file doesn't exist
async function getFileStat(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

// Check if WebP output is up-to-date compared to source PNG
async function isWebpUpToDate(pngPath, webpPath) {
  const pngStat = await fs.stat(pngPath);
  const webpStat = await getFileStat(webpPath);

  if (!webpStat) return false;
  return webpStat.mtime >= pngStat.mtime;
}

// Process a single PNG file
async function processPngFile(pngPath, outputDir, thumbDir) {
  const filename = basename(pngPath);
  const baseName = filename.replace(/\.png$/i, '');

  const webpPath = join(outputDir, `${baseName}.webp`);
  const thumbPath = join(thumbDir, `${baseName}.webp`);

  const webpUpToDate = await isWebpUpToDate(pngPath, webpPath);
  const thumbUpToDate = await isWebpUpToDate(pngPath, thumbPath);

  if (webpUpToDate && thumbUpToDate) {
    return { skipped: true, pngPath, reason: 'both outputs up-to-date' };
  }

  try {
    const image = sharp(pngPath);
    const metadata = await image.metadata();

    // Generate full-size WebP if needed
    if (!webpUpToDate) {
      await image
        .webp({ quality: 92, lossless: false, nearLossless: true })
        .toFile(webpPath);
    }

    // Generate thumbnail WebP if needed
    if (!thumbUpToDate) {
      await sharp(pngPath)
        .resize(300, null, { withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(thumbPath);
    }

    return { success: true, pngPath, webpPath, thumbPath };
  } catch (error) {
    return { error: true, pngPath, message: error.message };
  }
}

// Process files in batches
async function processBatch(files, outputDir, thumbDir, batchSize = 8) {
  const results = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(file => processPngFile(file, outputDir, thumbDir))
    );
    results.push(...batchResults);
  }

  return results;
}

// Main function
async function main() {
  try {
    const projectRoot = await findProjectRoot(__dirname);
    const imageDir = join(projectRoot, 'public', 'images', 'coloriages');
    const thumbDir = join(imageDir, 'thumbs');

    console.log(`Project root: ${projectRoot}`);
    console.log(`Image directory: ${imageDir}`);
    console.log(`Thumbnail directory: ${thumbDir}`);

    // Ensure directories exist
    await fs.mkdir(imageDir, { recursive: true });
    await fs.mkdir(thumbDir, { recursive: true });

    // Find all PNG files
    const files = await fs.readdir(imageDir);
    const pngFiles = files
      .filter(file => file.toLowerCase().endsWith('.png'))
      .map(file => join(imageDir, file));

    if (pngFiles.length === 0) {
      console.log('No PNG files found to process.');
      return;
    }

    console.log(`\nFound ${pngFiles.length} PNG file(s) to process...\n`);

    // Process files in batches
    const results = await processBatch(pngFiles, imageDir, thumbDir, 8);

    // Print results
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const result of results) {
      if (result.error) {
        console.error(`✗ ${result.pngPath}`);
        console.error(`  Error: ${result.message}`);
        errorCount++;
      } else if (result.skipped) {
        console.log(`⊘ ${result.pngPath} (skipped: ${result.reason})`);
        skippedCount++;
      } else {
        console.log(`✓ ${result.pngPath}`);
        successCount++;
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('Summary:');
    console.log(`  Processed: ${successCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Total: ${results.length}`);
    console.log(`${'='.repeat(60)}`);

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();
