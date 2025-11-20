## FMR Validation Tracker

- Scope covers both `fmr-validation-app` (Expo client) and `fmr-validation-services` (NestJS BFF).

### Current Snapshot
- App: Expo Router navigation with forms workflow (standalone drafts, attach via QR/ABEMIS) and offline cache via `expo-sqlite` (`storage/offline-store.ts`); auth now auto-refreshes tokens from `/auth/refresh`.
- BFF: Nest service with domain modules (auth, projects/forms, analytics, locator, sync), global JWT guard, ABEMIS-backed seeding (fallback to fixtures), TypeORM migrations (no auto-sync), shared ABEMIS/types, and CORS.
- Defaults: `EXPO_PUBLIC_API_URL` points to `http://172.16.9.22:3000`; seeded users in the app README for local login; BFF `.env.example` includes `DATABASE_URL`, ABEMIS keys, and JWT secrets.

### Completed
- Mobile env wiring and documentation for connecting to the BFF.
- Offline snapshot normalization and draft attach/upsert flows in the app.
- BFF endpoints for auth, projects/forms, analytics, locator, and sync with ABEMIS seeding + migrations; shared types added under `src/common/types`.
- Repo scripts: `npm run start`/`lint`/`check` (app) and `pnpm run start:dev`/`lint`/`test` (services).
- Migration hardening: idempotent baseline migration to tolerate existing FK/table names when rerunning.

### Task Board
- **Mobile**
  - [x] Wire auth flow to handle JWT expiry/refresh once the BFF issues real tokens; update token storage/hooks.
  - [x] Consume DB-backed forms endpoints when persistence lands; verify offline sync and attachment flows stay consistent.
  - [x] Keep client types in sync with server DTOs; document any new env vars in `fmr-validation-app/README.md`.
  - [x] Add basic automated checks when ready (lint stays required; consider light UI/integration smoke tests).
- **Backend**
  - [x] Replace seed repository access with ABEMIS integrations (HttpModule clients + mapping layer), keeping tokens server-only.
  - [x] Add Postgres persistence with migrations; align `/forms`, `/forms/:id/attach`, and `/sync/*` to the database.
  - [x] Issue and validate JWTs (guards/interceptors); expose token metadata needed by the app.
  - [x] Expand Jest coverage for auth, forms, and sync flows; keep `pnpm run lint` green.
  - [x] Maintain contract hygiene: update shared types in `src/common/types` alongside app types; document new env vars in `fmr-validation-services/README.md`.

### Runbook (quick)
- App: `cd fmr-validation-app && npm install && EXPO_PUBLIC_API_URL=http://localhost:3000 npm run start` (or keep default IP).
- Services: `cd fmr-validation-services && pnpm install && cp .env.example .env` (set `DATABASE_URL` + `ABEMIS_API_KEY`) then `pnpm run start:dev`.
