# Scanforge

Generador de códigos QR con analítica de escaneos — monorepo Angular 22 + NestJS 11.

- **Frontend**: Angular 22 (standalone, zoneless, signals, design system "Optic Ink" con Tailwind v4)
- **API**: NestJS 11 + TypeORM (SQLite dev / Neon Postgres prod), JWT auth (username-or-email)
- **Docs**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/API.md`](docs/API.md) · [`docs/FRONTEND.md`](docs/FRONTEND.md)

## Quickstart

```bash
npm install --legacy-peer-deps

# API (SQLite + seed demo)
cd apps/api
DATABASE_TYPE=better-sqlite3 DATABASE_PATH=data/scanforge.db SEED_DB=true JWT_SECRET=dev PORT=3045 node dist/main.js

# Frontend
cd apps/web
npm run build
```

Demo: `demo@scanforge.app` / `demo1234`
