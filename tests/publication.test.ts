import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { coloringKey, verifyPublishedArtwork, selectApprovedColorings } from '../scripts/lib/coloring-assets.mjs';

describe('catalog publication preflight', () => {
  it('normalizes legacy imports and translated asset aliases', () => {
    expect(coloringKey('/images/coloriages/nature-papillon.png')).toBe('nature-papillon');
    expect(coloringKey('https://cdn.colotopia.com/coloriages/thumbs/gardening-tools.webp')).toBe('jardinage-outils');
    expect(() => coloringKey('https://example.org/x.png')).toThrow();
    expect(() => coloringKey('../x')).toThrow();
  });
  it('rejects a missing thumbnail before inserting either locale', async () => {
    const png = await sharp({create:{width:600,height:800,channels:3,background:'#fff'}}).png().toBuffer();
    const webp = await sharp(png).webp().toBuffer();
    const fetcher: typeof fetch = async (input) => String(input).includes('/thumbs/')
      ? new Response('missing', {status:404}) : new Response(String(input).endsWith('.png') ? png : webp);
    await expect(verifyPublishedArtwork('test', fetcher)).rejects.toThrow('404');
  });
  it('rejects HTML served with a successful status', async () => {
    await expect(verifyPublishedArtwork('test', async () => new Response('<html>bad</html>'))).rejects.toThrow();
  });
  it('imports only approved pictures in both languages', () => {
    const rows = [{locale:'fr', image:'/images/coloriages/approved.png'}, {locale:'en', image:'approved'}, {locale:'fr', image:'rejected'}];
    expect(selectApprovedColorings(rows, ['approved'])).toEqual(rows.slice(0,2));
    expect(() => selectApprovedColorings(rows, [])).toThrow();
    expect(() => selectApprovedColorings(rows, ['missing'])).toThrow();
  });
});
