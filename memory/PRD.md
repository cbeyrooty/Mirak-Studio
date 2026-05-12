# MIRAK STUDIOS — Splash Page

## Problem Statement
Single-page, interactive placeholder splash for Mirak Studios. Cinematic tone-setter
with a premium 70s/80s analog film aesthetic, theatrical and grounded in massive
physical production scale. Frontend-only (React).

## User Choices (Dec 2025)
- Boot calibration: **Purely abstract** (no text, no labels)
- Logo: **Static + metallic specular + slow ambient breathing**
- Tagline: **No tagline**
- Audio: **Optional muted cinematic hum toggle**

## Architecture
- `src/App.js` — root renders `MirakSplash`
- `src/components/MirakSplash.jsx` — phase orchestration, cursor tracking, eased
  spotlight (RAF lerp), layered scene
- `src/components/BootSequence.jsx` — canvas: dense RGB pixel grid, focal matrix
  (rings + crosshairs + corner brackets + scattered focal points), anamorphic
  horizontal flare + secondary sweep
- `src/components/TopoCanvas.jsx` — fractal-noise field + marching-squares
  contour lines (28 levels) for Albanian topographical map
- `src/components/HumToggle.jsx` — WebAudio synthesized rumble + sub + bandpass
  noise hiss (no external asset)
- `src/App.css` — all visual systems: phases, mask-based spotlight reveal,
  mask-based metallic logo + specular sweep, SVG turbulence film grain,
  letterbox bars, vignette, footer mark

## Implemented (Dec 2025)
- Phase 1 boot calibration (3.5s) → dissolves into Phase 2
- Cinematic charcoal main canvas with topo lines + film grain + vignette + letterbox
- Centered logo via CSS mask with rich metallic gradient (#5c5849 → #f5ecd4 → #5c5849)
- Animated specular highlight sweep across logo (11s cycle)
- Slow breathing pulse on logo (6.4s)
- Cursor flashlight: eased RAF lerp (0.085) with radial mask reveal (320px radius, soft decay)
- Soft amber additive glow following cursor (warm light bleed)
- Optional WebAudio hum toggle (rumble 52Hz + sub 78Hz + filtered noise)
- Responsive (mobile reduces spotlight radius + logo size)

## Backlog / P2
- Add a reduced-motion media query branch (disable breathing/grain animation for accessibility)
- Add an exit-to-site CTA if Mirak chooses to extend beyond splash

## Notes
- No backend changes — splash is purely client-rendered.
- Logo source: `/app/frontend/src/assets/mirak-logo.png` (imported by JS, used as mask via CSS var).
