# Farm Game Prototype

A small 2D browser farm game prototype inspired by cozy farming games, built with Phaser 3 and Vite.

## Project structure

- `frontend/` — Phaser + Vite game client
- `backend/` — local Express service used only for health checks during development

## Local development

```bash
cd d:\test
npm install
npm run dev
```

Then open:

- http://localhost:5173/

## Production build

```bash
cd d:\test
npm run build
```

This creates the production bundle in `frontend/dist`.

## Cloudflare Pages deployment

For the current version, the game is static and can be hosted on Cloudflare Pages without a backend.

Recommended configuration:

- Framework preset: Vite
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Output directory: `dist`

The Express backend should be deployed separately only if you later add server-side features such as authentication, persistence, or multiplayer.
