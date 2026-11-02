import { it, expect } from 'vitest';
import { canvasPoint, drawingSize, StrokeHistory, type Stroke } from '../src/lib/painting';
import { onlinePath, paintingHref } from '../src/lib/online-coloring';
const stroke = (x: number): Stroke => ({ tool:'marker', color:'#ff0000', size:12, points:[{x,y:5}] });
it('keeps pointer coordinates aligned after responsive scaling, zoom and scrolling', () => {
  expect(canvasPoint(90,160,{left:10,top:40,width:320,height:480},800,1200)).toEqual({x:200,y:300});
  expect(canvasPoint(90,160,{left:-70,top:-80,width:640,height:960},800,1200)).toEqual({x:200,y:300});
  // Captured pointer positions outside the paper must not be clamped to its edge.
  expect(canvasPoint(-20,10,{left:10,top:10,width:320,height:480},800,1200).x).toBe(-75);
});
it('preserves portrait and landscape proportions while bounding canvas memory', () => {
  expect(drawingSize(2480,3508)).toEqual({width:1086,height:1536});
  expect(drawingSize(3508,2480)).toEqual({width:1536,height:1086});
  expect(drawingSize(400,600)).toEqual({width:400,height:600});
});
it('returns older strokes for flattening, retaining the complete image beyond the undo limit', () => {
  const h=new StrokeHistory(2), a=stroke(1), b=stroke(2), c=stroke(3);
  expect(h.add(a)).toBeUndefined(); h.add(b); expect(h.add(c)).toBe(a);
  expect(h.undo()).toBe(true); expect(h.undo()).toBe(true); expect(h.undo()).toBe(false);
  expect(h.redo()).toBe(true); expect(h.past).toEqual([b]);
  h.add(stroke(4)); expect(h.redo()).toBe(false);
});
it('keeps editor links on canonical drawing URLs instead of duplicating the catalog', () => {
  expect(paintingHref('fr','chat')).toBe('/fr/coloriage/chat/#colorier');
  expect(paintingHref('en','cat')).toBe('/en/coloring/cat/#colorier');
  expect(onlinePath('fr')).toBe('/fr/coloriage-en-ligne/');
});
