import { defineConfig, devices } from '@playwright/test';
import { defineBddProject } from 'playwright-bdd';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.join(__dirname, '.env') });

const scenarioTimeout = Number.parseInt(process.env.PWCRAFT_TIMEOUT ?? '60000', 10);
const baseURL = process.env.PWCRAFT_BASE_URL ?? 'http://localhost:4200';

const htmlDir = process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ?? 'playwright-report';
const htmlOpen = (process.env.PLAYWRIGHT_HTML_OPEN as 'always' | 'never' | 'on-failure' | undefined) ?? 'on-failure';
const htmlTitle = process.env.PLAYWRIGHT_HTML_TITLE ?? 'pw-craft — Gherkin (Playwright)';
const monocartFile = process.env.MONOCART_REPORT_FILE ?? 'monocart-report/index.html';

function pwVideo(): 'off' | 'on' | 'retain-on-failure' {
  const m = process.env.PWCRAFT_VIDEO_RECORD_MODE?.trim().toLowerCase();
  if (m === 'on' || m === 'off' || m === 'retain-on-failure') return m;
  if (process.env.PWCRAFT_VIDEO_RECORD === 'true' || process.env.PWCRAFT_VIDEO_RECORD === '1') return 'on';
  return 'off';
}

function pwTrace(): 'off' | 'on' | 'retain-on-failure' | 'on-first-retry' {
  const v = process.env.PWCRAFT_TRACE_CAPTURE?.trim().toLowerCase();
  if (v === 'on' || v === 'off' || v === 'retain-on-failure' || v === 'on-first-retry') return v;
  return 'off';
}

function pwScreenshot(): 'off' | 'on' | 'only-on-failure' {
  const c = process.env.PWCRAFT_SCREENSHOT_CAPTURE;
  if (c === 'always') return 'on';
  if (c === 'never') return 'off';
  return 'only-on-failure';
}

const rootBdd = defineBddProject({
  name: 'root',
  features: 'test/features/**/*.feature',
  steps: ['test/bdd/fixtures.ts', 'test/step-definitions/**/*.ts', 'test/support/**/*.ts'],
  outputDir: '.features-gen/root',
});

export default defineConfig({
  timeout: scenarioTimeout,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  metadata: {
    suite: 'pw-craft Gherkin',
    baseURL,
    generatedAt: new Date().toISOString(),
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: htmlDir, open: htmlOpen, title: htmlTitle }],
    [
      'monocart-reporter',
      {
        name: 'pw-craft — Gherkin results',
        outputFile: monocartFile,
      },
    ],
  ],
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    trace: pwTrace(),
    screenshot: pwScreenshot(),
    video: pwVideo(),
  },
  projects: [
    {
      ...rootBdd,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
