import { useEffect, useRef, useState, useCallback } from "react";
import TopoCanvas from "@/components/TopoCanvas";
import HumToggle from "@/components/HumToggle";
import mirakLogo from "@/assets/mirak-logo.png";

const BLACK_HOLD = 450;   // brief black before main fades in
const FADE_IN = 1200;     // when main becomes fully visible

export default function MirakSplash() {
  const [phase, setPhase] = useState("black"); // 'black' | 'main'
  const cursorRef = useRef({ x: -1000, y: -1000 });
  const targetRef = useRef({ x: -1000, y: -1000 });
  const spotlightRef = useRef(null);
  const glowRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("main"), BLACK_HOLD);
    // Strip the platform-injected badge for the splash placeholder
    const removeBadge = () => {
      const el = document.getElementById("emergent-badge");
      if (el) el.remove();
    };
    removeBadge();
    const badgeInterval = setInterval(removeBadge, 500);
    setTimeout(() => clearInterval(badgeInterval), 6000);
    return () => {
      clearTimeout(t);
      clearInterval(badgeInterval);
    };
  }, []);

  const handleMove = useCallback((e) => {
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    const x = point.clientX;
    const y = point.clientY;
    if (typeof x !== "number" || typeof y !== "number") return;
    targetRef.current = { x, y };
  }, []);

  useEffect(() => {
    const recenter = () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      cursorRef.current = { x: cx, y: cy };
      targetRef.current = { x: cx, y: cy };
    };
    recenter();

    const tick = () => {
      const c = cursorRef.current;
      const t = targetRef.current;
      c.x += (t.x - c.x) * 0.085;
      c.y += (t.y - c.y) * 0.085;
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty("--mx", `${c.x}px`);
        spotlightRef.current.style.setProperty("--my", `${c.y}px`);
      }
      if (glowRef.current) {
        glowRef.current.style.setProperty("--mx", `${c.x}px`);
        glowRef.current.style.setProperty("--my", `${c.y}px`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Keep spotlight inside the viewport when the window is resized/rotated
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = targetRef.current;
      const c = cursorRef.current;
      if (t.x > w || t.y > h || t.x < 0 || t.y < 0) {
        targetRef.current = { x: w / 2, y: h / 2 };
      }
      if (c.x > w || c.y > h || c.x < 0 || c.y < 0) {
        cursorRef.current = { x: w / 2, y: h / 2 };
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchstart", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [handleMove]);

  return (
    <div
      className="mirak-root"
      data-testid="mirak-splash-root"
      style={{ "--mirak-logo-url": `url(${mirakLogo})` }}
    >
      <div
        className={`mirak-main ${phase === "main" ? "is-main" : ""}`}
        data-testid="mirak-main-canvas"
      >
        <div className="mirak-base" />

        <div className="mirak-topo-wrap" ref={spotlightRef} data-testid="mirak-topo-layer">
          <TopoCanvas />
        </div>

        <div className="mirak-glow" ref={glowRef} aria-hidden="true" />

        <div className="mirak-anamorphic" aria-hidden="true" />

        <div className="mirak-logo-stage" data-testid="mirak-logo-stage">
          <div className="mirak-logo-breathe">
            <div
              className="mirak-logo"
              role="img"
              aria-label="Mirak Studio"
              data-testid="mirak-logo"
            />
            <div className="mirak-logo-specular" aria-hidden="true" />
          </div>
          <div className="mirak-subheader" data-testid="mirak-subheader">
            <span className="mirak-subheader-rule" aria-hidden="true" />
            <span className="mirak-subheader-text">
              The largest virtual production stage in the Balkans
            </span>
            <span className="mirak-subheader-rule" aria-hidden="true" />
          </div>
        </div>

        <div className="mirak-grain" aria-hidden="true" />
        <div className="mirak-vignette" aria-hidden="true" />
        <div className="mirak-letterbox mirak-letterbox-top" aria-hidden="true" />
        <div className="mirak-letterbox mirak-letterbox-bottom" aria-hidden="true" />

        <HumToggle active={phase === "main"} autoStart />

        <div className="mirak-footer-mark" data-testid="mirak-footer-mark">
          <span className="mirak-footer-dot" />
          <span>EST 2026</span>
          <span className="mirak-footer-sep">/</span>
          <span>COMING SOON</span>
        </div>
      </div>

      {/* Solid black overlay that fades away — replaces the boot phase */}
      <div
        className={`mirak-black-overlay ${phase === "main" ? "is-gone" : ""}`}
        aria-hidden="true"
      />
    </div>
  );
}
