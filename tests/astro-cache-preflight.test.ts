import { afterEach, beforeEach, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

let temporary: string;
beforeEach(() => { temporary = mkdtempSync(join(tmpdir(), 'colotopia-cache-test-')); });
afterEach(() => { rmSync(temporary, { recursive: true, force: true }); });

function preflight(directory = temporary) {
  return JSON.parse(execFileSync(process.execPath, [resolve('scripts/quarantine-invalid-astro-cache.mjs'), directory], { encoding: 'utf8' })).astroCachePreflight;
}

it('preserves valid JSON and image bytes, including expired metadata', () => {
  const files = { 'fresh.webp.json': '{"expires":9999999999999}', 'expired.webp.json': '{"expires":0}', 'other.json': 'null', 'fresh.webp': 'image bytes', 'expired.webp': 'other image bytes' };
  for (const [name, bytes] of Object.entries(files)) writeFileSync(join(temporary, name), bytes);
  expect(preflight()).toEqual({ inspected: 3, quarantined: [] });
  expect(readdirSync(temporary).sort()).toEqual(Object.keys(files).sort());
  for (const [name, bytes] of Object.entries(files)) expect(readFileSync(join(temporary, name), 'utf8')).toBe(bytes);
});

it('renames only invalid metadata reversibly and does not touch its image', () => {
  const invalid = { 'truncated.webp.json': '{"expires":', 'empty.webp.json': '' };
  for (const [name, bytes] of Object.entries(invalid)) writeFileSync(join(temporary, name), bytes);
  writeFileSync(join(temporary, 'truncated.webp'), 'keep image');
  const result = preflight();
  expect(result.inspected).toBe(2);
  expect(result.quarantined).toHaveLength(2);
  for (const { source, destination } of result.quarantined) {
    expect(existsSync(join(temporary, source))).toBe(false);
    expect(destination).toMatch(/\.json\.invalid-[\da-f-]+$/);
    expect(readFileSync(join(temporary, destination), 'utf8')).toBe(invalid[source as keyof typeof invalid]);
  }
  expect(readFileSync(join(temporary, 'truncated.webp'), 'utf8')).toBe('keep image');
  expect(preflight()).toEqual({ inspected: 0, quarantined: [] });
  for (const { source, destination } of result.quarantined) renameSync(join(temporary, destination), join(temporary, source));
  for (const [name, bytes] of Object.entries(invalid)) expect(readFileSync(join(temporary, name), 'utf8')).toBe(bytes);
});

it('skips symlinks, directories and non-JSON files without following them', () => {
  writeFileSync(join(temporary, 'target.txt'), '{');
  symlinkSync('target.txt', join(temporary, 'linked.json'));
  symlinkSync('missing-target', join(temporary, 'broken.json'));
  mkdirSync(join(temporary, 'nested.json'));
  writeFileSync(join(temporary, 'nested.json', 'entry.json'), '{');
  expect(preflight()).toEqual({ inspected: 0, quarantined: [] });
  expect(lstatSync(join(temporary, 'linked.json')).isSymbolicLink()).toBe(true);
  expect(lstatSync(join(temporary, 'broken.json')).isSymbolicLink()).toBe(true);
  expect(readFileSync(join(temporary, 'target.txt'), 'utf8')).toBe('{');
  expect(readFileSync(join(temporary, 'nested.json', 'entry.json'), 'utf8')).toBe('{');
});

it('accepts an absent cache without creating or scanning a parent directory', () => {
  const missing = join(temporary, 'absent');
  writeFileSync(join(temporary, 'untouched.json'), '{');
  expect(preflight(missing)).toEqual({ inspected: 0, quarantined: [] });
  expect(existsSync(missing)).toBe(false);
  expect(readFileSync(join(temporary, 'untouched.json'), 'utf8')).toBe('{');
});
