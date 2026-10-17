export function fitA4(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('Invalid image dimensions');
  const scale = Math.min(190 / width, 277 / height);
  const w = width * scale, h = height * scale;
  return { x: (210 - w) / 2, y: (297 - h) / 2, width: w, height: h };
}
export function pdfFilename(title: string) {
  return (title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'colotopia') + '.pdf';
}
