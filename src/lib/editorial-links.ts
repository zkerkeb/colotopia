import { parseFragment, serialize, type DefaultTreeAdapterMap } from 'parse5';

/** Keep editorial text readable while a linked drawing is awaiting correction. */
export function removeFlaggedColoringLinks(html: string, flaggedPaths: Set<string>): string {
  const fragment = parseFragment(html);
  function visit(node: DefaultTreeAdapterMap['node']) {
    if ('tagName' in node && node.tagName === 'a') {
      const href = node.attrs.find(attr => attr.name === 'href')?.value;
      if (href) {
        let url: URL | undefined;
        try { url = new URL(href, 'https://colotopia.com'); } catch { /* Leave invalid links for site verification. */ }
        const pathname = url?.pathname.replace(/\/?$/, '/');
        if (url && ['colotopia.com', 'www.colotopia.com'].includes(url.hostname) && pathname && flaggedPaths.has(pathname)) {
          node.tagName = 'span';
          node.nodeName = 'span';
          node.attrs = node.attrs.filter(attr => !['href', 'target', 'rel', 'download'].includes(attr.name));
        }
      }
    }
    if ('childNodes' in node) for (const child of node.childNodes) visit(child);
  }
  visit(fragment);
  return serialize(fragment);
}
