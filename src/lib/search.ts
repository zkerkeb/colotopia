import { normalizeTags } from './catalog';

export interface SearchItem {
  title: string; slug: string; tags: string[]; category: string;
  categoryLabel: string; url: string; thumbnail: string; audience: string;
}
export const normalizeSearch = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function parseSearchIndex(value: unknown): SearchItem[] {
  if (!Array.isArray(value)) throw new Error('Invalid search index');
  return value.filter(item => item && typeof item.title === 'string' && typeof item.url === 'string' && /^\/(fr\/coloriage|en\/coloring)\/[a-z0-9-]+\/?$/.test(item.url))
    .map(item => ({ ...item, tags: normalizeTags(item.tags), category: typeof item.category === 'string' ? item.category : '', categoryLabel: typeof item.categoryLabel === 'string' ? item.categoryLabel : '', audience: typeof item.audience === 'string' ? item.audience : '', thumbnail: typeof item.thumbnail === 'string' && item.thumbnail.startsWith('https://cdn.colotopia.com/') ? item.thumbnail : '' }));
}

export function searchCatalog(index: SearchItem[], query: string, audience = ''): SearchItem[] {
  const words = normalizeSearch(query.trim()).split(/\s+/).filter(Boolean);
  return index.filter(item => (!audience || item.audience === audience) && words.every(word =>
    normalizeSearch([item.title, item.category, item.categoryLabel, ...normalizeTags(item.tags)].join(' ')).includes(word)));
}

const requests = new Map<string, Promise<SearchItem[]>>();
export function loadSearchIndex(url: string): Promise<SearchItem[]> {
  if (!requests.has(url)) requests.set(url, fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(15_000) })
    .then(response => { if (!response.ok) throw new Error('Search unavailable'); return response.json(); })
    .then(parseSearchIndex).catch(error => { requests.delete(url); throw error; }));
  return requests.get(url)!;
}
