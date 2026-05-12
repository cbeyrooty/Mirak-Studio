# MIRAK STUDIO — Splash

Cinematic single-page placeholder for **MIRAK STUDIO** — the largest virtual production stage in the Balkans. Pure React, no backend.

Built with: React 19, CRA (via CRACO), CSS masking, Canvas 2D (topographical contour map), Tailwind base, Lucide icons.

---

## Features

- Fades in from black into a cinematic charcoal canvas
- Centered **metallic logo** rendered via CSS mask + animated specular sweep
- **Slow ambient breathing pulse** on the logo
- **Cursor flashlight reveal** — moves with eased decay over a procedurally generated topographical contour map (Albanian "Land of the Hills")
- Continuous **analog film grain** (SVG turbulence)
- **Anamorphic horizontal lens flare** sweeping the logo plane
- **Letterbox bars + vignette** for a 2.39:1 cinema feel
- Fully responsive — fluid sizing for everything from 320px phones to 4K ultrawide

---

## Quick Start (local dev)

```bash
cd frontend
yarn install
yarn start
```

Open http://localhost:3000.

## Production Build

```bash
cd frontend
yarn build
```

Build output is in `frontend/build/`.

---

## Deploying to GitHub Pages

The repo includes a ready-to-use **GitHub Actions workflow** (`.github/workflows/deploy.yml`) that builds the site on every push to `main` and publishes it to GitHub Pages automatically.

### Setup (one time)

1. Push this repo to GitHub.
2. In your repo settings, go to **Settings → Pages**.
3. Under **Source**, select **GitHub Actions**.
4. Push to `main` (or trigger the workflow manually from the Actions tab).
5. Your site goes live at `https://<your-username>.github.io/<your-repo-name>/`.

The `"homepage": "."` field in `frontend/package.json` ensures asset paths resolve correctly regardless of the repo name / subpath.

### Custom domain

If you point a custom domain at GitHub Pages, create a file `frontend/public/CNAME` containing just your domain (e.g. `mirakstudio.com`). The build will copy it into `build/CNAME` automatically.

---

## Project Structure

```
.
├── .github/workflows/deploy.yml   # GH Pages auto-deploy
├── .gitignore
├── README.md
└── frontend/
    ├── craco.config.js
    ├── jsconfig.json              # path alias: @/* → src/*
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── App.css                # all cinematic styling
        ├── index.js
        ├── index.css
        ├── assets/
        │   └── mirak-logo.png
        └── components/
            ├── MirakSplash.jsx    # main orchestrator
            └── TopoCanvas.jsx     # marching-squares contour map
```

---

## Replacing the Logo

Drop a square PNG with a transparent background into `frontend/src/assets/mirak-logo.png`. The mask + metallic gradient will adapt automatically — the only thing that matters is that the logo artwork is opaque on a transparent background.

## Editing the Tagline / Footer

Both live in `frontend/src/components/MirakSplash.jsx`:

- Subheader line: `The largest virtual production stage in the Balkans`
- Footer: `EST 2026 / COMING SOON`

## License

Proprietary — © MIRAK STUDIO. All rights reserved.
