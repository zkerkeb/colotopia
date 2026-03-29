import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

describe('build smoke test', () => {
  it('astro check passes (no TypeScript errors)', () => {
    // astro check validates all .astro and .ts files
    const result = execSync('npx astro check', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 120_000,
    });
    // astro check exits 0 on success; execSync throws on non-zero
    expect(result).toBeDefined();
  }, 120_000);

  it('image optimization script runs without error', () => {
    const result = execSync('node scripts/optimize-images.mjs', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 60_000,
    });
    expect(result).toBeDefined();
  }, 60_000);

  it('dist/ directory exists after last build', () => {
    // This checks that a build has been done at some point.
    // In CI, run `npm run build` before tests.
    expect(existsSync(join(ROOT, 'dist'))).toBe(true);
  });

  it('dist/ contains index.html', () => {
    const indexPath = join(ROOT, 'dist', 'fr', 'index.html');
    expect(existsSync(indexPath)).toBe(true);
  });

  it('dist/ contains EN pages', () => {
    const indexPath = join(ROOT, 'dist', 'en', 'index.html');
    expect(existsSync(indexPath)).toBe(true);
  });
});
