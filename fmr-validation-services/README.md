## FMR Validation BFF

Backend-for-frontend service that feeds the `fmr-validation-app` Expo client. It provides curated APIs for login, project/form browsing, analytics, and the locator map while still mirroring the data model from ABEMIS.

### Getting Started

```bash
cd fmr-validation-services
pnpm install        # install once
pnpm run start:dev  # start watch mode on http://localhost:3000
```

The service enables CORS so you can call it from the Expo app or Thunder Client. Override the port with `PORT=4000 pnpm run start:dev` as needed.

### Database Setup (PostgreSQL + TypeORM)

1. Provision a Postgres database and set `DATABASE_URL` in `.env` (ignored by git). Nest's `ConfigModule` loads this variable automatically.
2. Start the NestJS server (`pnpm run start:dev`). On boot, the new `DatabaseModule` connects via TypeORM, synchronizes the schema, and seeds the mock FMR/ABEMIS data from `src/data/projects.seed.ts` whenever the tables are empty.
3. Use `DATABASE_URL=... pnpm run start:dev` in other environments (staging/prod) to point at hosted Postgres instances.

Every repository call now flows through TypeORM (`src/shared/fmr.repository.ts`), so the API serves and mutates actual database rows. The `/sync/snapshot` endpoint still returns the exact payload shape required by the mobile offline cache.

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
| `POST` | `/auth/login` | Wraps ABEMIS-style credential login and returns a session token |
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
| `GET` | `/sync/snapshot` | Combined payload of projects + standalone drafts for seeding SQLite/JSON caches |
| `POST` | `/sync/forms` | Mock endpoint to upsert offline drafts coming from the mobile cache |

The payloads mirror the `ValidationForm` structure used in the mobile app. Data is currently backed by in-memory seed files (`src/data/*.ts`) so we can swap in real ABEMIS calls later without changing the client contract.

All `/forms` endpoints accept `projectId` and `abemisId` query params so you can fetch drafts tied to a specific FMR or pull down unlinked validations for follow-up.

### Form Attachment Flow

1. **Create draft without a project** – call `POST /forms` with annex data only. The record is stored without `linkedProjectId`.
2. **Capture QR or ABEMIS ID in the field** – mobile app reads the code and sends it to `PATCH /forms/:id/attach` (or the operator can type the ABEMIS ID manually).
3. **Repository links the draft** – the BFF resolves the referenced FMR and backfills metadata (`abemisId`, zone, location) so downstream screens get consistent data. Drafts remain queryable even when unlinked via `/forms?projectId=` filters.

### Project Layout

- `src/modules` – feature modules (auth, forms, projects, analytics, annexes, locator)
- `src/shared` – shared providers including the in-memory `FmrRepository`
- `src/data` – deterministic seed data for annexes, forms, and sample users
- `src/common/types` – shared TypeScript interfaces mirroring the Expo app models

### Next Steps

- Replace the repository seeds with real ABEMIS integrations (use `HttpModule` for upstream calls)
- Add persistence (Postgres or Redis) for drafts and sync queues
- Wire JWT authentication by swapping the stubbed token issuance with `@nestjs/jwt`
- Extend tests under `test/` once endpoints stabilize
