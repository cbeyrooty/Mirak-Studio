import { useEffect, useRef } from "react";

/**
 * High-fidelity topographical contour lines — Albanian mountainous terrain.
 * Generated once via fractal noise (sum-of-sines) then drawn as iso-contour
 * style horizontal flowing lines. Sits in the dark and is revealed only by
 * the cursor spotlight (parent handles the mask).
 */
export default function TopoCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Build elevation field via deterministic sum-of-sines
      const field = (x, y) => {
        const nx = x / w;
        const ny = y / h;
        let v = 0;
        v += Math.sin(nx * 7.1 + ny * 3.2) * 0.55;
        v += Math.sin(nx * 13.7 - ny * 8.4 + 1.3) * 0.32;
        v += Math.sin(nx * 21.3 + ny * 17.9 + 2.1) * 0.18;
        v += Math.sin(nx * 41.1 - ny * 33.7 + 0.7) * 0.09;
        // bias toward a few peaks (mountainous)
        const cx1 = (nx - 0.32) * (nx - 0.32) + (ny - 0.42) * (ny - 0.42);
        const cx2 = (nx - 0.74) * (nx - 0.74) + (ny - 0.61) * (ny - 0.61);
        v += Math.exp(-cx1 * 14) * 0.7;
        v += Math.exp(-cx2 * 18) * 0.55;
        return v;
      };

      // Draw contours by sampling along horizontal slices and using
      // marching-segment-style detection of level crossings.
      const levels = 28;
      const min = -2;
      const max = 2.5;
      const step = (max - min) / levels;
      const resX = 220; // sample density horizontally
      const resY = 140; // vertical slices
      const cellW = w / resX;
      const cellH = h / resY;

      // Precompute field grid
      const grid = new Float32Array((resX + 1) * (resY + 1));
      for (let j = 0; j <= resY; j++) {
        for (let i = 0; i <= resX; i++) {
          grid[j * (resX + 1) + i] = field(i * cellW, j * cellH);
        }
      }

      const get = (i, j) => grid[j * (resX + 1) + i];

      // Marching squares — minimal implementation drawing line segments
      for (let li = 0; li < levels; li++) {
        const level = min + li * step;
        const brightness = 0.32 + (li / levels) * 0.55;
        const isMajor = li % 5 === 0;
        ctx.strokeStyle = isMajor
          ? `rgba(225, 215, 195, ${brightness * 0.95})`
          : `rgba(200, 190, 175, ${brightness * 0.7})`;
        ctx.lineWidth = isMajor ? 1.1 : 0.6;
        ctx.beginPath();

        for (let j = 0; j < resY; j++) {
          for (let i = 0; i < resX; i++) {
            const a = get(i, j);
            const b = get(i + 1, j);
            const c = get(i + 1, j + 1);
            const d = get(i, j + 1);
            let idx = 0;
            if (a > level) idx |= 1;
            if (b > level) idx |= 2;
            if (c > level) idx |= 4;
            if (d > level) idx |= 8;
            if (idx === 0 || idx === 15) continue;

            const x0 = i * cellW;
            const y0 = j * cellH;
            const lerp = (va, vb, p0, p1) => {
              const t = (level - va) / (vb - va);
              return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
            };
            const top = () => lerp(a, b, [x0, y0], [x0 + cellW, y0]);
            const right = () => lerp(b, c, [x0 + cellW, y0], [x0 + cellW, y0 + cellH]);
            const bot = () => lerp(d, c, [x0, y0 + cellH], [x0 + cellW, y0 + cellH]);
            const left = () => lerp(a, d, [x0, y0], [x0, y0 + cellH]);

            let segs = [];
            switch (idx) {
              case 1: case 14: segs = [[left(), top()]]; break;
              case 2: case 13: segs = [[top(), right()]]; break;
              case 3: case 12: segs = [[left(), right()]]; break;
              case 4: case 11: segs = [[bot(), right()]]; break;
              case 5: segs = [[left(), top()], [bot(), right()]]; break;
              case 6: case 9: segs = [[top(), bot()]]; break;
              case 7: case 8: segs = [[left(), bot()]]; break;
              case 10: segs = [[top(), right()], [left(), bot()]]; break;
              default: segs = [];
            }
            for (const [p1, p2] of segs) {
              ctx.moveTo(p1[0], p1[1]);
              ctx.lineTo(p2[0], p2[1]);
            }
          }
        }
        ctx.stroke();
      }
    };

    render();
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="mirak-topo-canvas" />;
}
