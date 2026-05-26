import { describe, expect, it } from 'vitest';
import { cdnPng, cdnThumb, cdnWebp } from '../src/lib/cdn';

describe('CDN helpers', () => {
  it('builds URLs from plain image keys', () => {
    expect(cdnPng('vehicules-buggy-sentier-rocheux')).toBe(
      'https://cdn.colotopia.com/coloriages/vehicules-buggy-sentier-rocheux.png',
    );
    expect(cdnWebp('vehicules-buggy-sentier-rocheux')).toBe(
      'https://cdn.colotopia.com/coloriages/vehicules-buggy-sentier-rocheux.webp',
    );
    expect(cdnThumb('vehicules-buggy-sentier-rocheux')).toBe(
      'https://cdn.colotopia.com/coloriages/thumbs/vehicules-buggy-sentier-rocheux.webp',
    );
  });

  it('normalizes legacy local image paths before building CDN URLs', () => {
    expect(cdnPng('/images/coloriages/vehicules-buggy-sentier-rocheux.png')).toBe(
      'https://cdn.colotopia.com/coloriages/vehicules-buggy-sentier-rocheux.png',
    );
    expect(cdnThumb('/images/coloriages/vehicules-buggy-sentier-rocheux.png')).toBe(
      'https://cdn.colotopia.com/coloriages/thumbs/vehicules-buggy-sentier-rocheux.webp',
    );
  });

  it('normalizes existing CDN URLs without duplicating path segments or extensions', () => {
    expect(cdnPng('https://cdn.colotopia.com/coloriages/vehicules-buggy-sentier-rocheux.png')).toBe(
      'https://cdn.colotopia.com/coloriages/vehicules-buggy-sentier-rocheux.png',
    );
    expect(cdnThumb('https://cdn.colotopia.com/coloriages/thumbs/vehicules-buggy-sentier-rocheux.webp')).toBe(
      'https://cdn.colotopia.com/coloriages/thumbs/vehicules-buggy-sentier-rocheux.webp',
    );
  });
});
