# pw-craft Angular demo

Small **Angular 19** reference application used as the **application under test** for the parent [`pw-craft`](../README.md) Playwright + Gherkin suite. It exercises async UIs, forms, tables, accessibility patterns, and animations so examples in `test/features` stay realistic.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`. Ensure `PWCRAFT_BASE_URL` in the **repository root** `.env` matches this URL when you run BDD tests.

## Build

```bash
npm run build
```

Production output goes to `angular-app/dist/`. Component style budgets are configured in `angular.json` for this demo’s richer home page styling.

## End-to-end tests

E2E is **not** `ng e2e`. Scenarios live in the parent repo under `../test/features` and run with **playwright-bdd** from the parent:

```bash
npm run e2e
```

That runs `bddgen` and `playwright test` from the repository root. See the parent [README](../README.md) for prerequisites, tags, and report commands (`npm run report`, `npm run report:monocart`).

## Stack

- Angular CLI **19.x**, standalone components, lazy-friendly routing under `src/app/pages/`
- **Angular Material** (toolbar, cards, buttons, form controls, etc.)

When you add a new demo page, register the route, add a home card with a stable `data-testid`, and extend the Gherkin suite in the parent `test/` tree.
