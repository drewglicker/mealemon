# Mealemon

A homebrew Mealime replacement focused on:
- Curated, step-by-step recipe catalog
- Multi-recipe combined grocery list aggregation
- Dynamic serving scaling

Mobile-first PWA built with React (Vite) + TypeScript + Tailwind CSS, backed by Convex
for real-time data. Recipes are scraped/ingested from `./data/*.json` via `scripts/seed.ts`.

## Stack
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS + Lucide icons + fraction.js
- Backend: Convex (schema, queries, mutations)
- PWA: vite-plugin-pwa (offline cache for active grocery list)
- Units: US Imperial only

## Dev
```
npm install
npx convex dev      # in one terminal, sets up/links Convex deployment
npm run seed        # ingest recipes from ./data into Convex
npm run dev          # Vite dev server
```
