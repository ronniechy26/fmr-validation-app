# AGENTS Instructions for `fmr-validation`

## Multi-Repo Layout
- `fmr-validation-app/` – Expo Router mobile client already configured per AGENTS in that subtree. Use the existing instructions when working inside.
- `fmr-validation-services/` – umbrella for backend services (e.g., NestJS BFF, worker tasks). Keep each service in its own folder (e.g., `fmr-validation-bff/`). Shared infra scripts belong under `fmr-validation-services/scripts/`.

## Coordination Principles
- Treat ABEMIS as the source of truth. Backend services proxy or synchronize with ABEMIS rather than duplicating credentials or data definitions.
- The Backend-for-Frontend wraps ABEMIS auth: clients send credentials to the BFF, which authenticates with ABEMIS and returns short-lived JWTs for the app. Never expose ABEMIS tokens to the mobile client.
- Align API contracts with the mobile app’s needs. Add mapping layers inside services so upstream schema changes do not leak into the client.
- Every feature or data contract change must be reflected in both `fmr-validation-app/` and `fmr-validation-services/` during the same task. Update mobile mocks/UI plus backend DTOs/endpoints together so the repos stay in sync.
- Do not request sandbox/network approvals mid-task. Work within current permissions and plan changes assuming approval requests are disallowed.

## Dev Environment
- Node 18+ required for both Expo and NestJS projects. Use `corepack enable` to keep PNPM/NPM versions consistent when needed.
- Install dependencies per project (`npm install` inside `fmr-validation-app/`, `npm install` inside each service). Do not mix lockfiles.
- Environment variables: create `.env` files inside each project root and document keys in the corresponding README.

## Backend Service Standards
- Use NestJS for the BFF. Core modules: `AuthModule` (wrap ABEMIS login), `FmrModule` (FMR data), `SharedModule` (HTTP clients, DTOs).
- Organize code by domain (e.g., `auth/`, `fmr/`, `common/`). Export reusable DTOs/types from `libs/` if multiple services need them.
- Add linting via `@nestjs/eslint-plugin` or `eslint-config-custom` to mirror mobile conventions (two spaces, single quotes in JSX/TSX).
- Provide npm scripts: `start`, `start:dev`, `lint`, `test`, plus `start:debug` if using the Nest debugger.

## Testing & Release
- Mobile validation: `npm run lint` + Expo app manual QA. Backend validation: `npm run test` + integration tests for critical ABEMIS flows.
- Document repro steps, data contracts, and manual verification notes when submitting PRs across repos; link to the corresponding client/server change if both sides need coordination.
- Use Conventional Commits for all repos under this umbrella (e.g., `feat(app): add checklist tab`, `chore(bff): refresh abemis token handling`).

## Security & Secrets
- Never commit real ABEMIS credentials. Use env vars loaded via `@nestjs/config` for services and `expo-constants` for the client.
- Rotate tokens via the BFF; log only sanitized identifiers. Centralize secret management (e.g., 1Password, Doppler, etc.).

## Deployment Notes
- Host mobile builds through EAS if needed; backend services deploy separately (e.g., Render, Fly.io, AWS). Mirror environment names (dev, staging, prod) across app and services to reduce mistakes.
- Each deployment should publish its API contract changes; use versioned routes or feature flags to roll out FMR-related features safely.

---

# Repository Guidelines (fmr-validation-app)

## Project Structure & Module Organization
- The Expo Router entry resides in `app/`, where `_layout.tsx`, `modal.tsx`, and route groups like `app/(tabs)/index.tsx` define navigation; add new screens within this tree so paths map directly to URLs.
- Shared presentation pieces live in `components/`, reusable logic in `hooks/`, and configuration values in `constants/`; import from these directories instead of duplicating code in screen files.
- Keep imagery and fonts in `assets/` with descriptive names (for example, `assets/images/fmr-logo.png`) so bundling stays deterministic.
- Internal utilities, such as `scripts/reset-project.js`, belong in `scripts/`; run them via npm scripts instead of executing files directly.

## Build, Test, and Development Commands
- `npm run start` – starts the Expo bundler for the default platform and prints QR/device options.
- `npm run android` / `npm run ios` / `npm run web` – target specific runtimes; keep one bundler session active per platform.
- `npm run lint` – runs `expo lint` with the repo’s `eslint.config.js`; fix warnings before pushing.
- `npm run reset-project` – relocates starter routes to `app-example/` and clears `app/`; only run on a clean working tree.

## Coding Style & Naming Conventions
- The project uses TypeScript with functional React components; prefer arrow components and hooks over class components.
- Follow the ESLint rules from `eslint-config-expo`; keep two-space indentation and single quotes in JSX unless the rule set says otherwise.
- Name screen files with PascalCase (e.g., `UserProfile.tsx`) inside the route folders, components with PascalCase in `components/`, and hooks with `use` prefixes in `hooks/`.
- Reusable type aliases or interfaces must live in `types/` and be imported via the `@/types/*` path; the ESLint `no-restricted-syntax` override will fail the build if exported types are declared elsewhere.

## Modern UI Design Rules
- Target a clean, modern design language: balanced white space, rounded corners, subtle shadows, and consistent motion; avoid skeuomorphic elements or heavy gradients.
- Prefer contemporary typography stacks and sizes that align with the Expo defaults; never hard-code pixel values when theme tokens exist.
- Keep primary actions clear and elevated through color, contrast, and consistent button styles sourced from `components/`.
- Maintain dark-mode readiness by avoiding baked-in light colors; always leverage theme variables or semantic color helpers.
- Ensure layouts collapse gracefully on small devices and stretch elegantly on tablets by using flexbox patterns and shared spacing constants.

## Testing Guidelines
- Automated tests are not yet configured; when adding them, place unit specs beside the target file with a `.test.tsx` suffix and wire them through a `npm test` script.
- Until a harness exists, rely on manual validation through the Expo app (device or simulator) plus `npm run lint` for static checks.
- Document repro steps for any bugs you fix inside the pull request so reviewers can verify behaviour quickly.

## Commit & Pull Request Guidelines
- Use short, imperative commit messages; adopting a Conventional Commits prefix such as `feat: add intake form tabs` keeps the linear history searchable.
- Each pull request should describe the change, include screenshots or screen recordings for UI work, and mention related issues.
- Ensure the branch is rebased on the latest `main`, lint passes locally, and any manual testing notes are listed before requesting review.
