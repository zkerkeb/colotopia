export type Tool = 'pencil' | 'marker' | 'brush' | 'eraser';
export type Point = { x: number; y: number };
export type Stroke = { tool: Tool; color: string; size: number; points: Point[] };
export const palette = [
  ['#ef646c', 'Rouge', 'Red'], ['#f59d47', 'Orange', 'Orange'], ['#f6d653', 'Jaune', 'Yellow'],
  ['#77bc80', 'Vert', 'Green'], ['#6dd5b7', 'Menthe', 'Mint'], ['#59c3e5', 'Turquoise', 'Turquoise'],
  ['#527fdb', 'Bleu', 'Blue'], ['#ac89d0', 'Violet', 'Purple'], ['#eb98bd', 'Rose', 'Pink'],
  ['#ab7c60', 'Marron', 'Brown'], ['#383641', 'Noir', 'Black'], ['#ffffff', 'Blanc', 'White'],
] as const;
export function canvasPoint(clientX: number, clientY: number, rect: Pick<DOMRect, 'left'|'top'|'width'|'height'>, width: number, height: number): Point {
  return { x: (clientX - rect.left) * width / rect.width, y: (clientY - rect.top) * height / rect.height };
}
export function drawingSize(width: number, height: number, max = 1536) {
  const ratio = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}
// An undo limit bounds memory. Older strokes are painted into a base layer,
// never discarded from the picture. The original line art is never edited.
export class StrokeHistory {
  past: Stroke[] = [];
  future: Stroke[] = [];
  constructor(private limit = 40) {}
  add(stroke: Stroke) { this.past.push(stroke); this.future = []; return this.past.length > this.limit ? this.past.shift() : undefined; }
  undo() { const s = this.past.pop(); if (s) this.future.push(s); return !!s; }
  redo() { const s = this.future.pop(); if (s) this.past.push(s); return !!s; }
  reset() { this.past = []; this.future = []; }
}
export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('export')), 'image/png'));
}
const makeCanvas = (width: number, height: number) => Object.assign(document.createElement('canvas'), { width, height });
export class Painting {
  readonly history = new StrokeHistory();
  private base: HTMLCanvasElement;
  private committed: HTMLCanvasElement;
  private layer: HTMLCanvasElement;
  constructor(readonly canvas: HTMLCanvasElement) {
    this.base = makeCanvas(canvas.width, canvas.height);
    this.committed = makeCanvas(canvas.width, canvas.height);
    this.layer = makeCanvas(canvas.width, canvas.height);
  }
  private paint(target: HTMLCanvasElement, stroke: Stroke) {
    const ctx = this.layer.getContext('2d')!;
    ctx.clearRect(0, 0, this.layer.width, this.layer.height);
    ctx.lineWidth = stroke.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = ctx.strokeStyle = stroke.color;
    if (stroke.tool === 'pencil') {
      const tile = makeCanvas(48, 48), t = tile.getContext('2d')!;
      t.fillStyle = stroke.color;
      t.globalAlpha = .32; t.fillRect(0, 0, 48, 48); t.globalAlpha = .6;
      let seed = 17;
      for (let i = 0; i < 900; i++) { seed = (seed * 16807) % 2147483647; const x = seed % 48; seed = (seed * 16807) % 2147483647; t.fillRect(x, seed % 48, 1, 1); }
      ctx.fillStyle = ctx.strokeStyle = ctx.createPattern(tile, 'repeat')!;
    }
    const [first, ...rest] = stroke.points;
    if (!first) return;
    if (!rest.length) { ctx.beginPath(); ctx.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(first.x, first.y); for (const p of rest) ctx.lineTo(p.x, p.y); ctx.stroke(); }
    const dest = target.getContext('2d')!;
    dest.save();
    dest.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    dest.globalAlpha = stroke.tool === 'brush' ? .38 : 1;
    dest.drawImage(this.layer, 0, 0); dest.restore();
  }
  preview(stroke?: Stroke) {
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); ctx.drawImage(this.committed, 0, 0);
    if (stroke) this.paint(this.canvas, stroke);
  }
  add(stroke: Stroke) {
    const oldest = this.history.add(stroke);
    if (oldest) this.paint(this.base, oldest);
    this.paint(this.committed, stroke); this.preview();
  }
  rebuild() {
    const ctx = this.committed.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); ctx.drawImage(this.base, 0, 0);
    for (const stroke of this.history.past) this.paint(this.committed, stroke);
    this.preview();
  }
  clear() {
    this.base.getContext('2d')!.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.history.reset(); this.rebuild();
  }
  async restore(blob: Blob) {
    const url = URL.createObjectURL(blob), image = new Image();
    try { image.src = url; await image.decode(); this.base.getContext('2d')!.drawImage(image, 0, 0, this.canvas.width, this.canvas.height); this.rebuild(); }
    finally { URL.revokeObjectURL(url); }
  }
  snapshot() { return canvasBlob(this.committed); }
  async export(image: HTMLImageElement) {
    const out = makeCanvas(this.canvas.width, this.canvas.height), ctx = out.getContext('2d')!;
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(this.committed, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(image, 0, 0, out.width, out.height);
    return canvasBlob(out);
  }
}
