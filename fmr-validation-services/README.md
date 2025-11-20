## FMR Validation BFF

Backend-for-frontend service that feeds the `fmr-validation-app` Expo client. It provides curated APIs for login, project/form browsing, analytics, and the locator map while still mirroring the data model from ABEMIS.

### Getting Started

```bash
cd fmr-validation-services
pnpm install        # install once
cp .env.example .env
# update ABEMIS_API_KEY if needed (defaults to staging key provided)
# set JWT_SECRET / JWT_REFRESH_SECRET for token issuance
pnpm run start:dev  # start watch mode on http://localhost:3000
```

The service enables CORS so you can call it from the Expo app or Thunder Client. Override the port with `PORT=4000 pnpm run start:dev` as needed. ABEMIS calls default to `https://abemis.staging.bafe.gov.ph` with the provided `x-api-key`; change `ABEMIS_BASE_URL`/`ABEMIS_API_KEY` in `.env` to target other environments.

### Database Setup (PostgreSQL + TypeORM)

1. Provision a Postgres database and set `DATABASE_URL` in `.env` (ignored by git). Nest's `ConfigModule` loads this variable automatically.
2. Start the NestJS server (`pnpm run start:dev`). On boot, the `DatabaseModule` connects via TypeORM, runs migrations (no auto-synchronize), and attempts to seed from ABEMIS first (falls back to `src/data/projects.seed.ts` if unavailable). After startup, ABEMIS sync refreshes the DB via `/sync/snapshot`.
3. Use `DATABASE_URL=... pnpm run start:dev` in other environments (staging/prod) to point at hosted Postgres instances.

Every repository call now flows through TypeORM (`src/shared/fmr.repository.ts`), so the API serves and mutates actual database rows. The `/sync/snapshot` endpoint still returns the exact payload shape required by the mobile offline cache.

To force a reseed (drop + reimport projects/forms) on next start, set `ABEMIS_SEED_RESET=true` in `.env` before launching.

Background sync: the service now polls ABEMIS on a timer (default every 900,000 ms / 15 minutes) and upserts projects. Configure `ABEMIS_SYNC_INTERVAL_MS` to change the cadence or `0` to disable. Sync is skipped when `ABEMIS_SEED_MODE=seed`.

### Available Scripts

- `pnpm run start` – compile then run the server once
- `pnpm run start:dev` – watch mode for local development
- `pnpm run start:prod` – run the compiled bundle in `dist/`
- `pnpm run lint` – lint all source files (auto-fixes enabled)
- `pnpm run test` – execute Jest unit tests (placeholder for now)

### API Overview

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Service heartbeat information |
| `POST` | `/auth/login` | Credential login; issues short-lived access token + refresh token |
| `POST` | `/auth/refresh` | Exchanges a refresh token for a new access/refresh token pair |
| `GET` | `/auth/profile/:id` | Fetch profile metadata for a logged-in user |
| `GET` | `/projects` | List projects with nested forms; supports `search`, `status`, `annexTitle` queries |
| `GET` | `/projects/:id` | Fetch a single project and all of its forms |
| `GET` | `/forms` | Flattened list of all forms with `status`, `projectId`, `annexTitle`, `search` filters |
| `GET` | `/forms/:id` | Fetch a single validation form |
| `POST` | `/forms` | Create a draft form; `projectId`/`abemisId` are optional so users can work offline |
| `PATCH` | `/forms/:id` | Update form fields or sync status |
| `PATCH` | `/forms/:id/attach` | Attach a draft to an existing FMR using `projectId`, `abemisId`, or `qrReference` |
| `GET` | `/annexes` | Static catalog of annex definitions used by the app |
| `GET` | `/analytics/summary` | Aggregated stats used by the Analytics tab |
| `GET` | `/locator/highlights` | Location cards for the Locator tab, filterable via `?zone=North|Central|South` |
| `GET` | `/sync/snapshot` | Combined payload of projects + standalone drafts for seeding SQLite/JSON caches (refreshes from ABEMIS first) |
| `POST` | `/sync/forms` | Mock endpoint to upsert offline drafts coming from the mobile cache |

The payloads mirror the `ValidationForm` structure used in the mobile app. Data is currently backed by in-memory seed files (`src/data/*.ts`) so we can swap in real ABEMIS calls later without changing the client contract.

All `/forms` endpoints accept `projectId` and `abemisId` query params so you can fetch drafts tied to a specific FMR or pull down unlinked validations for follow-up.

### Form Attachment Flow

1. **Create draft without a project** – call `POST /forms` with annex data only. The record is stored without `linkedProjectId`.
2. **Capture QR or ABEMIS ID in the field** – mobile app reads the code and sends it to `PATCH /forms/:id/attach` (or the operator can type the ABEMIS ID manually).
3. **Repository links the draft** – the BFF resolves the referenced FMR and backfills metadata (`abemisId`, zone, location) so downstream screens get consistent data. Drafts remain queryable even when unlinked via `/forms?projectId=` filters.

### Project Layout

- `src/modules` – feature modules (auth, forms, projects, analytics, annexes, locator)
- `src/shared` – shared providers including the ABEMIS client and `FmrRepository`
- `src/data` – deterministic seed data for annexes, forms, and sample users (fallback when ABEMIS is unavailable)
- `src/common/types` – shared TypeScript interfaces mirroring the Expo app models

### Next Steps

- Harden ABEMIS sync robustness (retry/partial updates) and map any new fields to client DTOs.
- Add migrations for future schema changes (current baseline migration is in `src/database/migrations`).
- Extend tests under `test/` once endpoints stabilize.
