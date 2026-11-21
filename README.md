# Cric Stats

A local-first cricket stats tracker for casual teams — teams, players, fixtures, ball-by-ball live scoring,
scorecards, charts and career/team records. Works offline as an installable PWA; all data lives in the browser
(IndexedDB) with a zip-based export/import for syncing between devices.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs a static site to `dist/` — deployable to Netlify, Vercel, GitHub Pages, or any static host.
`netlify.toml` is already set up (build command, publish dir, SPA redirect for client-side routing).

## Tech

React + TypeScript + Vite, Tailwind CSS v4, Dexie (IndexedDB), React Router, framer-motion, canvas-confetti.

## Sample data

`sample-data/` contains a generated backup (`.zip`) with 7 teams, 60+ players (with photos), fixtures and
matches — importable via Settings → Import, to try the app out without entering everything by hand.
