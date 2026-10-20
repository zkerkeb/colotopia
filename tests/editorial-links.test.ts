import { describe, expect, it } from 'vitest';
import { removeFlaggedColoringLinks } from '../src/lib/editorial-links';

describe('links to drawings awaiting correction', () => {
  const flagged = new Set(['/fr/coloriage/chat/', '/en/coloring/cat/']);
  it('preserves rich text while removing the unavailable destination in either language', () => {
    const html = '<p><a href="/fr/coloriage/chat"><strong>Chat</strong></a> / <a href="https://colotopia.com/en/coloring/cat/?print=1#image" target="_blank">Cat</a></p>';
    expect(removeFlaggedColoringLinks(html, flagged)).toBe('<p><span><strong>Chat</strong></span> / <span>Cat</span></p>');
  });
  it('preserves published, external and unknown links so verification can still detect mistakes', () => {
    const html = '<a href="/fr/coloriage/chien/">Chien</a><a href="https://example.com/fr/coloriage/chat/">External</a><a href="/fr/coloriage/typo/">Unknown</a>';
    expect(removeFlaggedColoringLinks(html, flagged)).toBe(html);
  });
  it('restores the original link automatically after the flag is resolved', () => {
    const html = '<a href="/fr/coloriage/chat/">Chat</a>';
    expect(removeFlaggedColoringLinks(html, new Set())).toBe(html);
  });
});
