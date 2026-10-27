import { describe, expect, it } from 'vitest';
import { coloringMetadata } from '../src/lib/seo';
import { pairTranslations } from '../src/lib/catalog';
import { legacyRedirects, nginxRedirectMap } from '../src/lib/legacy-redirects';

describe('specific drawing metadata', () => {
  it.each([undefined, '', '  \n '])('falls back for empty fields without homepage boilerplate: %s', value => {
    const result = coloringMetadata('fr', 'Dinosaure facile', value, value);
    expect(result.title).toBe('Coloriage Dinosaure facile à imprimer');
    expect(result.description).toContain('« Dinosaure facile »');
  });
  it('preserves supplied editorial metadata and trims whitespace', () => {
    expect(coloringMetadata('en', 'Cat', ' My cat page ', ' Custom description ')).toEqual({ title: 'My cat page', description: 'Custom description' });
    expect(coloringMetadata('en', 'Cat').title).toBe('Cat Coloring Page');
  });
  it('replaces age claims from the old seed only when they contradict the audience', () => {
    const stale = 'Coloriage fractale. Parfait pour les enfants de 3 a 8 ans.';
    expect(coloringMetadata('fr', 'Fractale complexe', undefined, stale, 'adultes').description).not.toContain('3 a 8');
    expect(coloringMetadata('fr', 'Chat', undefined, stale, 'enfants').description).toBe(stale);
    expect(coloringMetadata('en', 'Fractal', undefined, 'Perfect for children aged 3 to 8.', 'adultes').description).not.toContain('3 to 8');
    expect(coloringMetadata('fr', 'Fractale', undefined, 'Un motif détaillé pour adultes.', 'adultes').description).toBe('Un motif détaillé pour adultes.');
  });
});
describe('stable translation identity', () => {
  it('keeps the same page after either image is regenerated', () => {
    expect(pairTranslations([{ slug: 'chat', image: 'new-fr' }], [{ slug: 'cat', image: 'older-en' }], [['chat', 'cat']])).toEqual({ frToEn: { chat: 'cat' }, enToFr: { cat: 'chat' } });
  });
  it('does not point to an unpublished translation', () => {
    expect(pairTranslations([{ slug: 'chat', image: 'new' }], [], [['chat', 'cat']])).toEqual({ frToEn: {}, enToFr: {} });
  });
  it('rejects conflicting manual pairs', () => {
    expect(() => pairTranslations([{ slug: 'chat', image: 'a' }, { slug: 'lapin', image: 'b' }], [{ slug: 'cat', image: 'a' }], [['chat', 'cat'], ['lapin', 'cat']])).toThrow('Ambiguous');
  });
});
describe('exact legacy redirects', () => {
  const image = 'https://cdn.colotopia.com/coloriages/chat-r0123456789ab.png';
  const rows = [{ slug: 'chat', locale: 'fr', image }, { slug: 'cat', locale: 'en', image }];
  it('keeps the current print master and thumbnail for old image paths', () => {
    const redirects = legacyRedirects(rows, { '/en/coloriage/chat/': '/en/coloring/cat/' }, { kitten: 'chat' });
    expect(redirects['/images/coloriages/chat.png']).toBe(image);
    expect(redirects['/images/coloriages/kitten.webp']).toBe(image.replace('.png', '.webp'));
    expect(redirects['/images/coloriages/thumbs/cat.webp']).toContain('/thumbs/chat-r0123456789ab.webp');
    expect(redirects['/en/coloriage/chat']).toBe('/en/coloring/cat/');
    expect(redirects['/images/coloriages/nonexistent.png']).toBeUndefined();
    expect(nginxRedirectMap(redirects)).toContain('"/en/coloriage/chat" "/en/coloring/cat/";');
  });
  it('fails publication for a missing destination instead of creating a soft 404', () => {
    expect(() => legacyRedirects(rows, { '/old/': '/fr/coloriage/missing/' })).toThrow('no published target');
  });
  it('redirects a translated navigation path only after its destination was built', () => {
    const aliases = { '/en/ete/': '/en/summer/' };
    expect(() => legacyRedirects(rows, aliases, {})).toThrow('no published target');
    expect(legacyRedirects(rows, aliases, {}, ['/en/summer/'])['/en/ete']).toBe('/en/summer/');
  });
});
