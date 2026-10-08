# Campus Connect

Private, verified social network for college students in India.

**Stack:** TanStack Start · React 19 · Supabase · Tailwind CSS v4 · shadcn/ui

## Quick start (local)

```bash
npm install
cp .env.example .env.local
# Fill Supabase keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See **[SETUP.md](./SETUP.md)** for database + auth setup, and **[DEPLOY.md](./DEPLOY.md)** to go live.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript check |

## College emails

Students can sign up with official Indian academic emails:

- Any `*.ac.in` / `*.edu.in` / `*.res.in` domain
- 300+ seeded institutions (IITs, NITs, IIITs, central/state & private universities)

## Project layout

```
src/routes/          File-based routes (TanStack Start)
src/components/      UI + campus components
src/integrations/    Supabase + auth
src/lib/             Shared utilities + college directory
drizzle/migrations/  SQL schema & seeds
SETUP_ALL.sql        One-shot DB setup for Supabase
```

## Deploy

Primary target: **Vercel** (`vercel.json` included).  
Also works on Node hosts (Railway, Render, VPS) via `npm run build && npm start`.

Full steps → [DEPLOY.md](./DEPLOY.md)
