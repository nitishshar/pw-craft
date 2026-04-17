# pw-craft

`pw-craft` is a Playwright-first TypeScript library that packages configuration, helpers, HTML/JSON/JUnit reporting, and a small **Gherkin → Playwright** setup ([playwright-bdd](https://github.com/vitalets/playwright-bdd)) so teams keep `.feature` files while using the **Playwright test runner** only (no separate Cucumber CLI).

## Installation

```bash
git clone <your-repo-url> pw-craft
cd pw-craft
npm install
```

Copy `.env.example` to `.env` and adjust values for your environment.

## Quick start (standalone TypeScript)

```ts
import { BrowserManager, Navigator, ElementFinder, ActionHelper, WaitHelper, AssertHelper } from './dist/index';

async function main() {
  const manager = new BrowserManager({ baseUrl: 'http://localhost:4200', headless: true });
  const page = await manager.launch();
  const nav = new Navigator(page, 'http://localhost:4200');
  const find = new ElementFinder(page);
  const action = new ActionHelper(page);
  const wait = new WaitHelper(page);
  const assert = new AssertHelper(page);

  await nav.goto('/');
  await assert.textContains(find.byTestId('home-hero-title'), /pw-craft/i);

  await manager.close();
}

main().catch(console.error);
```

> Note: when developing inside this repo, import from `./dist` after `npm run build`.

## Running tests (Gherkin + Playwright only)

Gherkin lives in `test/features/**/*.feature` (the Angular demo app is the application under test). **playwright-bdd** generates Playwright tests under `.features-gen/`; you do **not** need `cucumber-js` or `cucumber.config.cjs`.

### Prerequisites

1. **Install dependencies** (repo root and Angular app):

   ```bash
   npm install
   cd angular-app && npm install && cd ..
   ```

2. **Start the app** (default port `4200`):

   ```bash
   cd angular-app
   npm start
   ```

3. **Environment** — `test/bdd/fixtures.ts` loads `.env` from the repo root. Set at least `PWCRAFT_BASE_URL` to match `ng serve`.

### All BDD scenarios (`npm test`)

From the **repository root**:

```bash
npm test
```

This runs **`bddgen`** (regenerates `.features-gen/` from `.feature` files) then **`playwright test`** using the `root` project in `playwright.config.ts`:

| Playwright project | Features | Step files |
| --- | --- | --- |
| `root` | `test/features/**/*.feature` | `test/bdd/fixtures.ts`, `test/step-definitions/**/*.ts`, `test/support/**/*.ts` |

### Angular shortcut (`npm run e2e`)

From **`angular-app/`**:

```bash
npm run e2e
```

Runs `bddgen` then the same **`playwright test`** suite from the parent directory (convenience when your terminal cwd is the demo app).

Reports are written next to `playwright.config.ts` (repo root), not inside `angular-app/`. From **`angular-app/`**, open them with **`npm run report`** (Playwright HTML) or **`npm run report:monocart`** (Monocart). Running `npx playwright show-report` with no path only works from the **repository root** (or pass `..\playwright-report` on Windows).

### Subsets, tags, and CI

After `bddgen`, use normal Playwright CLI filtering ([docs](https://playwright.dev/docs/test-cli)):

```bash
npx bddgen && npx playwright test --grep "Drag and drop"
npx bddgen && npx playwright test --grep "Toolbar exposes"
```

This repo **gitignores** `.features-gen/`. Run **`bddgen` before `playwright test`** locally and in CI (already bundled in `npm test`). Teams that prefer deterministic diffs may commit `.features-gen/` instead and drop it from `.gitignore`.

## Reports

### HTML reports

`playwright.config.ts` registers:

1. **Playwright HTML** (`playwright-report/` by default) — traces, screenshots, and the familiar timeline UI. Open with:

   ```bash
   npm run report:playwright
   ```

2. **[Monocart reporter](https://github.com/cenfun/monocart-reporter)** (`monocart-report/index.html` by default) — tree-style layout, filters, and a polished summary. Open with `npm run report:monocart` or `npx monocart show-report monocart-report/index.html`.

Tune Playwright’s folder and title with `PLAYWRIGHT_HTML_OUTPUT_DIR`, `PLAYWRIGHT_HTML_OPEN`, `PLAYWRIGHT_HTML_TITLE` ([reporter options](https://playwright.dev/docs/test-reporters)). Set `MONOCART_REPORT_FILE` to change the Monocart output path.

### Trace, video, and screenshots

Scenario timeout comes from `PWCRAFT_TIMEOUT` (`playwright.config.ts` `timeout`). Browser media is driven by Playwright `use` options wired from **`PWCRAFT_TRACE_CAPTURE`**, **`PWCRAFT_SCREENSHOT_CAPTURE`**, **`PWCRAFT_VIDEO_RECORD` / `PWCRAFT_VIDEO_RECORD_MODE`** in `playwright.config.ts`.

**Extra Gherkin attachments** (console log dump, optional trace zip to `testInfo.attach`, per-step PNGs) use `PwCraftConfig.gherkin.attachments` in `test/bdd/fixtures.ts` / `src/bdd/pw-session.ts` — see `PWCRAFT_STEP_SCREENSHOTS`, `PWCRAFT_ATTACH_TRACE_ZIP`, etc. Video in the HTML report is primarily the Playwright `use.video` recorder.

### Programmatic HTML / JSON / JUnit (`ReportGenerator`)

For dashboards or release artifacts built from your own `TestResult[]` objects (independent of the Playwright HTML report), use the library’s `ReportGenerator`:

```ts
import { ReportGenerator, type TestResult } from 'pw-craft';

const gen = new ReportGenerator(
  {
    outputDir: 'reports',
    formats: ['html', 'json', 'junit'],
    title: 'Release verification',
    theme: 'dark',
    colors: { primary: '#22d3ee' },
    customCss: `body{letter-spacing:0.01em;}`,
    metadata: { branch: 'main', commit: 'abc123' },
  },
  logger,
);

gen.addResult({
  id: '1',
  name: 'Smoke',
  status: 'passed',
  durationMs: 1200,
  steps: [{ text: 'Open app', status: 'passed', durationMs: 400 }],
});

await gen.generate();
```

The HTML report embeds Chart.js from `cdn.jsdelivr.net` and is intentionally self-contained (no external CSS hosts beyond the Chart.js script).

## Library API (classes)

| Class | Responsibility |
| --- | --- |
| `BrowserManager` | Launch browser/context/page with merged `PwCraftConfig`, optional video recording |
| `Navigator` | URL building, navigation, query/hash helpers, tab management, history |
| `ElementFinder` | Opinionated locator helpers (roles, test ids, Angular-ish selectors, tables, frames) |
| `ActionHelper` | Clicks, typing, scrolling, drag/drop, uploads, clipboard, keyboard chords |
| `WaitHelper` | Waits for UI, network, Angular testability hooks, dialogs, downloads |
| `AssertHelper` | Thin `expect(...)` wrappers for common assertions + soft assertion helpers |
| `NetworkHelper` | Route mocking, delays, offline mode, capture lists |
| `StorageHelper` | Local/session storage helpers + cookies |
| `AccessibilityHelper` | Lightweight checks + accessibility snapshot helpers |
| `BasePage` | Page-object base wiring (`find`, `action`, `wait`, `assert`, `nav`, `logger`) |
| `MediaHelper` | Screenshots, trace start/stop, HTML capture, console log collection |
| `ReportGenerator` | Emits self-contained HTML (Chart.js CDN) + JSON + JUnit from `TestResult[]` |
| `PwCraftSession` | Per-scenario BDD session for playwright-bdd steps (`init`, `teardown`, `testInfo` attachments, soft asserts) |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PWCRAFT_BASE_URL` | Base URL used by `Navigator` defaults |
| `PWCRAFT_BROWSER` | `chromium` \| `firefox` \| `webkit` |
| `PWCRAFT_HEADLESS` | `true` / `false` |
| `PWCRAFT_TIMEOUT` | Default Playwright timeout (ms) |
| `PWCRAFT_SCREENSHOT_CAPTURE` | `on-failure` \| `always` \| `never` |
| `PWCRAFT_VIDEO_RECORD` | `true` / `false` |
| `PWCRAFT_TRACE_CAPTURE` | `on` \| `off` \| `on-first-retry` \| `retain-on-failure` |
| `PWCRAFT_STEP_SCREENSHOTS` | Toggle per-step PNG attachments (`true` / `false`) |
| `PWCRAFT_STEP_SCREENSHOTS_FULL_PAGE` | `true` / `false` — full-page step captures (default `false`) |
| `PWCRAFT_ATTACH_VIDEO` | Optional attach of context video via `testInfo` (`never` / `always` / `on-failure`); primary video is Playwright `use.video` |
| `PWCRAFT_ATTACH_TRACE_ZIP` | `never` \| `always` \| `on-failure` — attach trace zip to the test report via `testInfo.attach` |
| `PWCRAFT_VIDEO_RECORD_MODE` | `on` \| `off` \| `retain-on-failure` — overrides boolean `PWCRAFT_VIDEO_RECORD` when set |
| `PLAYWRIGHT_HTML_OUTPUT_DIR` | Output folder for Playwright HTML report (default `playwright-report`) |
| `PLAYWRIGHT_HTML_OPEN` | `always` \| `never` \| `on-failure` when opening the Playwright HTML report |
| `PLAYWRIGHT_HTML_TITLE` | Title shown in the Playwright HTML report |
| `MONOCART_REPORT_FILE` | Output path for the Monocart HTML report (default `monocart-report/index.html`) |

## Angular demo (`angular-app/`)

```bash
cd angular-app
npm install
npm start
```

Then open `http://localhost:4200/`.

Build:

```bash
cd angular-app
npm run build
```

The app is a **reference UI** for the library: Angular 19 standalone components, **Angular Material** for layout and controls, and a shared dark theme in `angular-app/src/styles.scss`. The home page lists **demo routes** as cards (hero, stats, and a grid of scenarios). Each card exposes a stable **`data-testid`** for Playwright (for example `feature-products`, `feature-form`, …); keep these aligned with `test/features` and step definitions when you add or rename demos.

| Demo route | Path | `data-testid` (card) |
| --- | --- | --- |
| Products | `/products` | `feature-products` |
| Form demo | `/form-demo` | `feature-form` |
| Async demo | `/async-demo` | `feature-async` |
| Counter | `/counter-demo` | `feature-counter` |
| Animation | `/animation-demo` | `feature-animation` |
| About | `/about` | `feature-about` |

More detail for working inside the demo app folder is in [`angular-app/README.md`](angular-app/README.md).

## Notes on TypeScript configuration

- `npm run build` compiles `src/` to `dist/` using `tsconfig.json`.
- Gherkin step files under `test/` are loaded by **playwright-bdd** / Playwright’s TypeScript support; no separate Cucumber TypeScript project is required.

## License

MIT (placeholder — update to match your distribution policy).
