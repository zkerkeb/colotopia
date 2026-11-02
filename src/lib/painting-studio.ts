import { Painting, canvasPoint, drawingSize, type Stroke, type Tool } from './painting';
import { loadPainting, savePainting } from './painting-storage';
import { track } from './analytics';

export function setupStudio(dialog: HTMLDialogElement) {
  const fr = dialog.dataset.locale === 'fr';
  const text = (a: string, b: string) => fr ? a : b;
  const find = <T extends HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const canvas = find<HTMLCanvasElement>('[data-paint]');
  const lines = find<HTMLImageElement>('[data-lines]');
  const viewport = find<HTMLElement>('[data-viewport]');
  const paper = find<HTMLElement>('[data-paper]');
  const undo = find<HTMLButtonElement>('[data-undo]'), redo = find<HTMLButtonElement>('[data-redo]');
  const done = find<HTMLButtonElement>('[data-done]'), result = find<HTMLDialogElement>('[data-result]');
  const confirm = find<HTMLDialogElement>('[data-confirm]');
  const status = find<HTMLElement>('[data-save]');
  const imageUrl = dialog.dataset.image!;
  // Shared image key preserves a drawing when switching between French/English.
  const key = imageUrl;
  const parameters = { coloring_slug: dialog.dataset.slug, locale: dialog.dataset.locale };
  let painting: Painting | undefined, loading: Promise<void> | undefined;
  let tool: Tool = 'pencil', color = '#f59d47', size = 30, zoom = 1, pan = false;
  let stroke: Stroke | undefined, pointer: number | undefined, frame = 0;
  let panStart: { x: number; y: number; left: number; top: number } | undefined;
  let savedVersion = 0, version = 0, exportedVersion = -1;
  let saveQueue = Promise.resolve(), exportUrl: string | undefined, previousOverflow = '', began = false;
  let closeTarget: HTMLElement | null = null;
  const controls = () => { undo.disabled = !painting?.history.past.length; redo.disabled = !painting?.history.future.length; done.disabled = !painting; };
  const fit = () => {
    if (!painting || !dialog.open) return;
    const width = Math.min(viewport.clientWidth, viewport.clientHeight * canvas.width / canvas.height) * zoom;
    const height = width * canvas.height / canvas.width;
    paper.style.width = `${width}px`; paper.style.height = `${height}px`;
    paper.style.marginTop = `${Math.max(0, (viewport.clientHeight - height) / 2)}px`;
    find('[data-zoom-reset]').textContent = `${Math.round(zoom * 100)} %`;
    (find<HTMLButtonElement>('[data-zoom-out]')).disabled = zoom === 1;
    (find<HTMLButtonElement>('[data-zoom-in]')).disabled = zoom === 3;
  };
  // Resize outside the observer delivery cycle when scrollbars change the viewport.
  let resizeFrame = 0;
  new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(fit); }).observe(viewport);
  function queueSave() {
    if (!painting) return;
    const current = ++version;
    // Snapshot immediately, serialize writes so an older gesture cannot win.
    const blob = painting.snapshot();
    status.textContent = text('Enregistrement…', 'Saving…');
    saveQueue = saveQueue.catch(() => {}).then(async () => {
      try {
        await savePainting(key, await blob); savedVersion = current;
        if (version === current) status.textContent = text('Enregistré sur cet appareil', 'Saved on this device');
      } catch {
        if (version === current) status.textContent = text('Sauvegarde indisponible. Utilise « Terminé » pour enregistrer ton image.', 'Local save unavailable. Use “Done” to save your image.');
      }
    });
  }
  function finish(cancelled = false) {
    if (pointer === undefined) return;
    if (canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
    pointer = undefined; panStart = undefined;
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    if (stroke && painting) {
      if (cancelled) painting.preview();
      else { painting.add(stroke); queueSave(); if (!began) { track('coloring_online_start', parameters); began = true; } }
    }
    stroke = undefined; controls();
  }
  canvas.addEventListener('pointerdown', e => {
    if (!painting || pointer !== undefined || !e.isPrimary || e.button !== 0) return;
    e.preventDefault(); pointer = e.pointerId; canvas.setPointerCapture(pointer);
    if (pan) { panStart = { x: e.clientX, y: e.clientY, left: viewport.scrollLeft, top: viewport.scrollTop }; return; }
    stroke = { tool, color, size: size * canvas.width / 800, points: [canvasPoint(e.clientX, e.clientY, canvas.getBoundingClientRect(), canvas.width, canvas.height)] };
    painting.preview(stroke);
  });
  canvas.addEventListener('pointermove', e => {
    if (pointer !== e.pointerId) return;
    e.preventDefault();
    if (panStart) { viewport.scrollLeft = panStart.left - (e.clientX - panStart.x); viewport.scrollTop = panStart.top - (e.clientY - panStart.y); return; }
    if (!stroke) return;
    const rect = canvas.getBoundingClientRect();
    for (const event of e.getCoalescedEvents?.().length ? e.getCoalescedEvents() : [e]) {
      const point = canvasPoint(event.clientX, event.clientY, rect, canvas.width, canvas.height);
      const last = stroke.points.at(-1)!;
      if (Math.hypot(point.x - last.x, point.y - last.y) >= .7) stroke.points.push(point);
    }
    // Bound a very long gesture without dropping any paint already applied.
    if (stroke.points.length > 3000) { painting!.add(stroke); queueSave(); const last = stroke.points.at(-1)!; stroke = { ...stroke, points: [last] }; }
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; painting?.preview(stroke); });
  });
  canvas.addEventListener('pointerup', e => { if (pointer === e.pointerId) finish(); });
  canvas.addEventListener('pointercancel', e => { if (pointer === e.pointerId) finish(true); });
  canvas.addEventListener('lostpointercapture', e => { if (pointer === e.pointerId) finish(); });
  const choosePan = (value: boolean) => { finish(); pan = value; dialog.dataset.pan = String(pan); find('[data-pan]').setAttribute('aria-pressed', String(pan)); };
  dialog.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(button => button.addEventListener('click', () => {
    finish(); tool = button.dataset.tool as Tool; choosePan(false);
    dialog.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  dialog.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(button => button.addEventListener('click', () => {
    finish(); color = button.dataset.color!; choosePan(false);
    dialog.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  dialog.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(button => button.addEventListener('click', () => {
    finish(); size = Number(button.dataset.size);
    dialog.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  function changeHistory(direction: 'undo' | 'redo') {
    finish(); if (painting?.history[direction]()) { painting.rebuild(); queueSave(); } controls();
  }
  undo.addEventListener('click', () => changeHistory('undo')); redo.addEventListener('click', () => changeHistory('redo'));
  dialog.addEventListener('keydown', e => {
    if (result.open || confirm.open) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); changeHistory(e.shiftKey ? 'redo' : 'undo'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); changeHistory('redo'); }
  });
  find('[data-pan]').addEventListener('click', () => choosePan(!pan));
  function setZoom(value: number) { finish(); zoom = Math.min(3, Math.max(1, value)); fit(); if (zoom === 1) { viewport.scrollTo(0,0); choosePan(false); } }
  find('[data-zoom-in]').addEventListener('click', () => setZoom(zoom + .5));
  find('[data-zoom-out]').addEventListener('click', () => setZoom(zoom - .5));
  find('[data-zoom-reset]').addEventListener('click', () => setZoom(1));
  find('[data-clear]').addEventListener('click', () => { if (painting) { finish(); confirm.showModal(); } });
  find('[data-cancel-clear]').addEventListener('click', () => confirm.close());
  find('[data-confirm-clear]').addEventListener('click', () => { painting?.clear(); queueSave(); controls(); confirm.close(); });
  async function initialize() {
    find('[data-load]').hidden = false; find('[data-retry]').hidden = true;
    find('[data-load-message]').textContent = text('Chargement du dessin…', 'Loading drawing…');
    try {
      const source = new URL(imageUrl, location.origin);
      if (source.origin !== 'https://cdn.colotopia.com') throw new Error('unexpected image source');
      const response = await fetch(`/cdn${source.pathname}`, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('image unavailable');
      const url = URL.createObjectURL(await response.blob());
      lines.src = url;
      try { await lines.decode(); } catch (error) { URL.revokeObjectURL(url); throw error; }
      const dimensions = drawingSize(lines.naturalWidth, lines.naturalHeight);
      canvas.width = dimensions.width; canvas.height = dimensions.height;
      painting = new Painting(canvas);
      try { const saved = await loadPainting(key); if (saved) { await painting.restore(saved); status.textContent = text('Coloriage retrouvé sur cet appareil', 'Coloring restored from this device'); } }
      catch { status.textContent = text('Sauvegarde locale indisponible. Tu peux enregistrer ton image avec « Terminé ».', 'Local save unavailable. You can save your image with “Done”.'); }
      paper.hidden = false; find('[data-load]').hidden = true; fit(); controls();
    } catch {
      painting = undefined;
      find('[data-load-message]').textContent = text('Le dessin n’a pas pu être chargé.', 'The drawing could not be loaded.'); find('[data-retry]').hidden = false;
    }
  }
  find('[data-retry]').addEventListener('click', () => { loading = initialize(); });
  done.addEventListener('click', async () => {
    if (!painting) return;
    finish(); done.disabled = true;
    try {
      const blob = await painting.export(lines);
      if (exportUrl) URL.revokeObjectURL(exportUrl);
      exportUrl = URL.createObjectURL(blob);
      find<HTMLImageElement>('[data-result-image]').src = exportUrl;
      const download = find<HTMLAnchorElement>('[data-download]'); download.href = exportUrl; download.download = `${dialog.dataset.slug}-colotopia.png`;
      result.showModal(); track('coloring_online_complete', parameters);
    } catch { status.textContent = text('Impossible de préparer l’image. Réessaie.', 'Could not prepare the image. Try again.'); }
    finally { controls(); }
  });
  find('[data-download]').addEventListener('click', () => { exportedVersion = version; track('coloring_online_download', parameters); });
  find('[data-continue]').addEventListener('click', () => result.close());
  function close() {
    if (!dialog.open) return;
    finish(); result.close(); confirm.close(); dialog.close();
    document.documentElement.style.overflow = previousOverflow;
    if (location.hash === '#colorier') history.replaceState(null, '', location.pathname + location.search);
    closeTarget?.focus({ preventScroll: true });
  }
  find('[data-close]').addEventListener('click', close);
  dialog.addEventListener('cancel', e => { if (e.target === dialog) { e.preventDefault(); close(); } });
  window.addEventListener('beforeunload', e => { if (version > savedVersion && version > exportedVersion) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('blur', () => finish());
  return {
    async open() {
      if (!dialog.open) {
        closeTarget = document.activeElement as HTMLElement; previousOverflow = document.documentElement.style.overflow;
        dialog.showModal(); document.documentElement.style.overflow = 'hidden';
        track('coloring_online_open', parameters);
      }
      if (!painting) { loading ??= initialize(); await loading; } fit();
    }, close,
  };
}
