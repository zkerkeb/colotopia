import { constants } from 'node:fs';
import { open, readdir, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

const directory = process.argv[2];
if (!directory || process.argv.length !== 3) {
  throw new Error('Usage: node scripts/quarantine-invalid-astro-cache.mjs <assets-cache-directory>');
}

let entries;
try {
  entries = await readdir(directory, { withFileTypes: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  entries = [];
}

let inspected = 0;
const quarantined = [];
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
  const source = join(directory, entry.name);
  // Do not follow symlinks, including one substituted after the directory read.
  const file = await open(source, constants.O_RDONLY | constants.O_NOFOLLOW);
  let contents;
  try {
    if (!(await file.stat()).isFile()) continue;
    contents = await file.readFile('utf8');
  } finally {
    await file.close();
  }
  inspected++;
  try {
    JSON.parse(contents);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    // Keep the original bytes alongside the cache for reversible recovery.
    const destination = `${entry.name}.invalid-${randomUUID()}`;
    await rename(source, join(directory, destination));
    quarantined.push({ source: entry.name, destination });
  }
}
console.log(JSON.stringify({ astroCachePreflight: { inspected, quarantined } }));
