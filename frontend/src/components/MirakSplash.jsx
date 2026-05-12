import { useEffect, useRef, useState, useCallback } from "react";
import BootSequence from "@/components/BootSequence";
import TopoCanvas from "@/components/TopoCanvas";
import HumToggle from "@/components/HumToggle";
import mirakLogo from "@/assets/mirak-logo.png";

const BOOT_DURATION = 3500;

export default function MirakSplash() {
  const [phase, setPhase] = useState("boot"); // 'boot' | 'dissolve' | 'main'
  const cursorRef = useRef({ x: -1000, y: -1000 });
  const targetRef = useRef({ x: -1000, y: -1000 });
  const spotlightRef = useRef(null);
  const glowRef = useRef(null);
  const rafRef = useRef(null);

  // Boot phase progression
  useEffect(() => {
    const dissolveTimer = setTimeout(() => setPhase("dissolve"), BOOT_DURATION - 600);
    const mainTimer = setTimeout(() => setPhase("main"), BOOT_DURATION);
    return () => {
      clearTimeout(dissolveTimer);
      clearTimeout(mainTimer);
    };
  }, []);

  // Mouse tracking + eased animation loop for spotlight
  const handleMove = useCallback((e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    targetRef.current = { x, y };
  }, []);

  useEffect(() => {
    // Initialize spotlight to center so reveal feels intentional on first frame
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    cursorRef.current = { x: cx, y: cy };
    targetRef.current = { x: cx, y: cy };

    const tick = () => {
      const c = cursorRef.current;
      const t = targetRef.current;
      // Heavy easing: lerp factor low for mechanical, deliberate feel
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

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [handleMove]);

  return (
    <div
      className="mirak-root"
      data-testid="mirak-splash-root"
      style={{ "--mirak-logo-url": `url(${mirakLogo})` }}
    >
      {/* Phase 2: Main canvas - mounted underneath so dissolve reveals it */}
      <div
        className={`mirak-main ${phase === "main" ? "is-main" : ""} ${phase === "dissolve" ? "is-revealing" : ""}`}
        data-testid="mirak-main-canvas"
      >
        {/* Deep charcoal base */}
        <div className="mirak-base" />

        {/* Topographical map (revealed by spotlight) */}
        <div className="mirak-topo-wrap" ref={spotlightRef} data-testid="mirak-topo-layer">
          <TopoCanvas />
        </div>

        {/* Soft additive glow that follows cursor — adds warmth to lit area */}
        <div className="mirak-glow" ref={glowRef} aria-hidden="true" />

        {/* Subtle horizontal anamorphic flare on the logo plane */}
        <div className="mirak-anamorphic" aria-hidden="true" />

        {/* Logo — centered, with metallic specular sweep + slow breathing */}
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
        </div>

        {/* Continuous analog film grain overlay */}
        <div className="mirak-grain" aria-hidden="true" />

        {/* Vignette to anchor cinematic frame */}
        <div className="mirak-vignette" aria-hidden="true" />

        {/* Letterbox bars — fine, top + bottom — pure cinema feel */}
        <div className="mirak-letterbox mirak-letterbox-top" aria-hidden="true" />
        <div className="mirak-letterbox mirak-letterbox-bottom" aria-hidden="true" />

        {/* Cinematic hum toggle */}
        <HumToggle active={phase === "main"} />

        {/* Footer mark */}
        <div className="mirak-footer-mark" data-testid="mirak-footer-mark">
          <span className="mirak-footer-dot" />
          <span>EST. ALBANIA</span>
          <span className="mirak-footer-sep">/</span>
          <span>LAND OF THE HILLS</span>
        </div>
      </div>

      {/* Phase 1: Boot calibration — overlay on top, dissolves out */}
      {phase !== "main" && (
        <div
          className={`mirak-boot ${phase === "dissolve" ? "is-dissolving" : ""}`}
          data-testid="mirak-boot-sequence"
        >
          <BootSequence />
        </div>
      )}
    </div>
  );
}
