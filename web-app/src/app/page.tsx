'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadNetwork, Network } from '@/app/lib/network';

export default function Home() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [net, setNet] = useState<Network | null>(null);
  const [result, setResult] = useState<string>('');
  const [pixels, setPixels] = useState<number[]>(() => new Array(28 * 28).fill(0));
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastIndex, setLastIndex] = useState<number | null>(null);

  const BRUSH_RADIUS = 2; // cells
  const BRUSH_SIGMA = 0.75; // falloff
  const STEP_SIZE = 0.25; // sub-cell sampling for smoother strokes

  const applyBrushAt = (arr: number[], cx: number, cy: number) => {
    for (let dy = -BRUSH_RADIUS; dy <= BRUSH_RADIUS; dy++) {
      for (let dx = -BRUSH_RADIUS; dx <= BRUSH_RADIUS; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || x >= 28 || y < 0 || y >= 28) continue;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2);
        if (d > BRUSH_RADIUS) continue;
        const weight = Math.exp(-(d2) / (2 * BRUSH_SIGMA * BRUSH_SIGMA));
        const idx = Math.floor(y) * 28 + Math.floor(x);
        arr[idx] = Math.max(arr[idx], weight);
      }
    }
  };

  const paintStroke = (fromIndex: number | null, toIndex: number) => {
    setPixels((prev) => {
      const next = prev.slice();
      const toX = toIndex % 28;
      const toY = Math.floor(toIndex / 28);
      if (fromIndex === null) {
        applyBrushAt(next, toX, toY);
        return next;
      }
      const fromX = fromIndex % 28;
      const fromY = Math.floor(fromIndex / 28);
      const dx = toX - fromX;
      const dy = toY - fromY;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      const samples = Math.max(1, Math.ceil(dist / STEP_SIZE));
      for (let i = 0; i <= samples; i++) {
        const t = samples === 0 ? 0 : i / samples;
        const x = fromX + dx * t;
        const y = fromY + dy * t;
        applyBrushAt(next, x, y);
      }
      return next;
    });
  };

  // Produce a slightly zoomed-out, centred 28x28 version of the drawn pixels
  const preprocess = (src: number[]): number[] => {
    const threshold = 0.1;
    let minX = 28, minY = 28, maxX = -1, maxY = -1;
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const v = src[y * 28 + x];
        if (v > threshold) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) {
      return new Array(28 * 28).fill(0);
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const scale = 0.8; // slight zoom out
    const newWidth = Math.max(1, Math.floor(width * scale));
    const newHeight = Math.max(1, Math.floor(height * scale));
    const centreX = Math.floor((28 - newWidth) / 2);
    const centreY = Math.floor((28 - newHeight) / 2);

    const dst = new Array(28 * 28).fill(0);
    for (let ny = 0; ny < newHeight; ny++) {
      for (let nx = 0; nx < newWidth; nx++) {
        const ox = Math.min(27, Math.max(0, minX + Math.floor(nx / scale)));
        const oy = Math.min(27, Math.max(0, minY + Math.floor(ny / scale)));
        const oldIdx = oy * 28 + ox;
        const newX = centreX + nx;
        const newY = centreY + ny;
        const newIdx = newY * 28 + newX;
        dst[newIdx] = Math.max(dst[newIdx], src[oldIdx]);
      }
    }
    return dst;
  };

  useEffect(() => {
    loadNetwork().then(setNet);
  }, []);

  const clearCanvas = () => {
    setPixels(new Array(28 * 28).fill(0));
    setResult('');
  };

  const predict = () => {
    if (!net) return;
    const processed = preprocess(pixels);
    const output = net.feedforward(processed);
    const guess = output.indexOf(Math.max(...output));
    setResult(String(guess));
  };

  const getIndexFromEvent = (e: React.PointerEvent): number | null => {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
    const col = Math.min(27, Math.max(0, Math.floor((x / rect.width) * 28)));
    const row = Math.min(27, Math.max(0, Math.floor((y / rect.height) * 28)));
    return row * 28 + col;
  };

  const onPointerDownGrid = (e: React.PointerEvent) => {
    e.preventDefault();
    console.log('Pointer down:', e.pointerType);  // Debug: Check if 'touch' or 'mouse'
    const idx = getIndexFromEvent(e);
    if (idx == null) return;
    setIsDrawing(true);
    setLastIndex(idx);
    if (gridRef.current) {
      gridRef.current.setPointerCapture(e.pointerId);
    }
    paintStroke(null, idx);
  };

  const onPointerMoveGrid = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    console.log('Pointer move:', e.pointerType);  // Debug
    const idx = getIndexFromEvent(e);
    if (idx == null) return;
    paintStroke(lastIndex, idx);
    setLastIndex(idx);
  };

  const onPointerUpGrid = (e: React.PointerEvent) => {
    setIsDrawing(false);
    setLastIndex(null);
    console.log('Pointer up');  // Debug
    if (gridRef.current) {
      gridRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <main className="min-h-dvh w-full flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-3xl bg-white/10 border-white/10 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-2xl">Handwritten Digit Recogniser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col items-center">
              <div
                ref={gridRef}
                onPointerDown={onPointerDownGrid}
                onPointerMove={onPointerMoveGrid}
                onPointerUp={onPointerUpGrid}
                onPointerLeave={onPointerUpGrid}
                onPointerCancel={onPointerUpGrid}  // Add for touch cancel
                className="border border-border touch-none cursor-crosshair select-none rounded-md shadow-xs"
                style={{ touchAction: 'none', width: 'min(88vw, 320px)', height: 'min(88vw, 320px)', display: 'grid', gridTemplateColumns: 'repeat(28, 1fr)', gridTemplateRows: 'repeat(28, 1fr)', backgroundColor: 'black' }}
              >
                {pixels.map((v, idx) => (
                  <div
                    key={idx}
                    style={{ backgroundColor: `rgb(${v * 255}, ${v * 255}, ${v * 255})` }}
                  />
                ))}
              </div>

              <div className="mt-4 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
                <Button className="cursor-pointer w-full sm:w-auto" variant="outline" onClick={clearCanvas}>Clear</Button>
                <Button className="cursor-pointer w-full sm:w-auto" onClick={predict} disabled={!net}>Predict</Button>
              </div>

              <p className="mt-3 text-center text-sm text-muted-foreground min-h-5">{result && <>I think it&apos;s a <span className="font-semibold">{result}</span></>}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}