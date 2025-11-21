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
- **Mobile (next)**
  - [x] Replace the simulated QR attach with a real scanner flow (expo-barcode-scanner), hitting `/forms/:id/attach` with `qrReference`/`abemisId` and surfacing inline errors for missing/invalid references.
  - [ ] Align the offline cache/types with any new ABEMIS fields coming from `/sync/snapshot`; update mocks and `fmr-validation-app/README.md` if new env toggles are needed.
- **Backend (next)**
  - [ ] Harden ABEMIS sync robustness (retry/backoff + partial updates) and map any new fields to DTOs/shared types so the app stays in lockstep.
  - [ ] Add Postgres-backed integration tests around `/forms/:id/attach` and `/sync/snapshot`, documenting status/error codes the mobile client should surface.
  - [ ] Prepare migrations for the next schema tweaks (attachments/annex updates) and keep `.env.example` in sync with new config keys.

### Runbook (quick)
- App: `cd fmr-validation-app && npm install && EXPO_PUBLIC_API_URL=http://localhost:3000 npm run start` (or keep default IP).
- Services: `cd fmr-validation-services && pnpm install && cp .env.example .env` (set `DATABASE_URL` + `ABEMIS_API_KEY`) then `pnpm run start:dev`.
