# pw-craft

`pw-craft` is a Playwright-first TypeScript library that packages configuration, helpers, HTML/JSON/JUnit reporting, and a Cucumber world so teams can write readable end-to-end tests without rebuilding the same plumbing every project.

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

> Note: when developing inside this repo, import from `./dist` after `npm run build`, or import `.ts` sources via `ts-node` like the Cucumber setup does.

## Quick start (Cucumber BDD)

1. Ensure your app is running (for this repo: `cd angular-app && npm start`).
2. From the repo root:

```bash
npm test
```

Cucumber configuration lives in `cucumber.config.cjs` and loads:

- `src/cucumber/hooks.ts` (browser lifecycle + attachments)
- `test/support/**/*.ts` (timeouts, shared wiring)
- `test/step-definitions/**/*.ts` (step defs)
- `test/features/**/*.feature` (Gherkin)

The Angular demo app has its own Cucumber suite under `angular-app/e2e`:

```bash
cd angular-app
npm run e2e
```

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
| `PwCraftWorld` | Cucumber world wiring (`init`, `teardown`, attachments, soft asserts) |

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
| `PWCRAFT_STEP_SCREENSHOTS` | `true` / `false` — capture a screenshot after each step |

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

## Reports (`ReportGenerator`)

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

## Notes on TypeScript configuration

- `npm run build` compiles `src/` to `dist/` using `tsconfig.json`.
- Cucumber runs TypeScript via `ts-node` using `tsconfig.cucumber.json` (includes `test/`).

## License

MIT (placeholder — update to match your distribution policy).
