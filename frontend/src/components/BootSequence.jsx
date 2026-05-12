import { useEffect, useRef } from "react";

/**
 * Phase 1 — abstract Virtual Production volume calibration.
 * Pure light / data / matrices. No text, no labels.
 */
export default function BootSequence() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let startTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Pre-generate dense grid of RGB light "pixels"
    const cellSize = 14;
    const cols = Math.ceil(window.innerWidth / cellSize) + 2;
    const rows = Math.ceil(window.innerHeight / cellSize) + 2;
    const cells = [];
    for (let i = 0; i < cols * rows; i++) {
      const r = Math.random();
      let color;
      if (r < 0.33) color = [255, 50, 60];
      else if (r < 0.66) color = [60, 255, 110];
      else color = [60, 130, 255];
      cells.push({
        color,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 2.2,
        baseAlpha: 0.05 + Math.random() * 0.35,
      });
    }

    const draw = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Background — pure black
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // Dense RGB data grid — syncing pulses
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          const cell = cells[idx];
          if (!cell) continue;
          const pulse = 0.5 + 0.5 * Math.sin(elapsed * cell.speed + cell.phase);
          // Wave sweep — horizontal sync
          const sweep = 0.5 + 0.5 * Math.sin(elapsed * 1.2 - x * 0.08);
          const alpha = cell.baseAlpha * pulse * sweep;
          ctx.fillStyle = `rgba(${cell.color[0]},${cell.color[1]},${cell.color[2]},${alpha})`;
          const px = x * cellSize - cellSize / 2;
          const py = y * cellSize - cellSize / 2;
          ctx.fillRect(px, py, cellSize - 2, cellSize - 2);
        }
      }

      // Focal matrices — concentric reticles that lock in
      const lockProgress = Math.min(elapsed / 2.4, 1);
      const reticleAlpha = 0.18 + 0.4 * lockProgress;
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = `rgba(220,230,255,${reticleAlpha})`;
      ctx.lineWidth = 1;

      // Cross-hair lines
      ctx.beginPath();
      const span = 280 * (1 - 0.7 * (1 - lockProgress));
      ctx.moveTo(-span, 0);
      ctx.lineTo(-30, 0);
      ctx.moveTo(30, 0);
      ctx.lineTo(span, 0);
      ctx.moveTo(0, -span);
      ctx.lineTo(0, -30);
      ctx.moveTo(0, 30);
      ctx.lineTo(0, span);
      ctx.stroke();

      // Concentric rings
      for (let i = 0; i < 4; i++) {
        const r = (60 + i * 70) * (0.6 + 0.4 * lockProgress);
        const ringAlpha = reticleAlpha * (1 - i * 0.18);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(220,230,255,${ringAlpha})`;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Corner brackets
      const bracket = 220 * (0.5 + 0.5 * lockProgress);
      const bLen = 26;
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = `rgba(240,245,255,${reticleAlpha * 1.1})`;
      [
        [-bracket, -bracket, 1, 1],
        [bracket, -bracket, -1, 1],
        [-bracket, bracket, 1, -1],
        [bracket, bracket, -1, -1],
      ].forEach(([bx, by, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx + bLen * dx, by);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx, by + bLen * dy);
        ctx.stroke();
      });

      // Floating focal points scattered
      ctx.fillStyle = `rgba(240,245,255,${reticleAlpha * 0.9})`;
      for (let i = 0; i < 8; i++) {
        const a = i * (Math.PI * 2) / 8 + elapsed * 0.4;
        const dist = 360 * lockProgress;
        const px = Math.cos(a) * dist;
        const py = Math.sin(a) * dist;
        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      }

      ctx.restore();

      // Anamorphic horizontal lens flare — pulses and sweeps
      const flareCycle = (elapsed % 2.2) / 2.2;
      const flareY = h * 0.5 + Math.sin(elapsed * 0.9) * h * 0.18;
      const flareIntensity = Math.sin(flareCycle * Math.PI) * 0.85;

      const flareGrad = ctx.createLinearGradient(0, flareY, w, flareY);
      flareGrad.addColorStop(0, "rgba(140,200,255,0)");
      flareGrad.addColorStop(0.35, `rgba(170,210,255,${flareIntensity * 0.35})`);
      flareGrad.addColorStop(0.5, `rgba(220,235,255,${flareIntensity * 0.9})`);
      flareGrad.addColorStop(0.65, `rgba(170,210,255,${flareIntensity * 0.35})`);
      flareGrad.addColorStop(1, "rgba(140,200,255,0)");
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, flareY - 1.4, w, 2.8);

      // Soft glow band around flare
      const bandGrad = ctx.createLinearGradient(0, flareY - 60, 0, flareY + 60);
      bandGrad.addColorStop(0, "rgba(80,140,220,0)");
      bandGrad.addColorStop(0.5, `rgba(120,180,240,${flareIntensity * 0.18})`);
      bandGrad.addColorStop(1, "rgba(80,140,220,0)");
      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, flareY - 60, w, 120);

      // Vertical sweep — secondary flare
      const sweepX = (elapsed * 0.6 * w) % (w * 1.4) - w * 0.2;
      const sweepGrad = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
      sweepGrad.addColorStop(0, "rgba(255,180,140,0)");
      sweepGrad.addColorStop(0.5, "rgba(255,200,160,0.12)");
      sweepGrad.addColorStop(1, "rgba(255,180,140,0)");
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(sweepX - 80, 0, 160, h);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="mirak-boot-canvas" data-testid="mirak-boot-canvas" />;
}
