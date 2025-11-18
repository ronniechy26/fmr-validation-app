# Repository Guidelines

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
