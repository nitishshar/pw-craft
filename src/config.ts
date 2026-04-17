import type { BrowserContextOptions, LaunchOptions } from '@playwright/test';

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

export type ScreenshotCaptureMode = 'on-failure' | 'always' | 'never';
export type VideoCaptureMode = 'on' | 'off' | 'retain-on-failure';
export type TraceCaptureMode = 'on-first-retry' | 'on' | 'off' | 'retain-on-failure';

/** When to attach optional scenario artifacts via Playwright testInfo */
export type ScenarioArtifactAttachMode = 'never' | 'always' | 'on-failure';

export interface GherkinAttachmentConfig {
  /** Attach a PNG after each Gherkin step */
  stepScreenshot: boolean;
  stepScreenshotFullPage: boolean;
  /** Requires `media.video.record` not `off` */
  video: ScenarioArtifactAttachMode;
  /** Requires `media.trace.capture` not `off` and a trace file produced */
  traceZip: ScenarioArtifactAttachMode;
}

export interface GherkinReportConfig {
  attachments: GherkinAttachmentConfig;
}

export interface ReportingThemeColors {
  primary: string;
  surface: string;
  background: string;
  text: string;
  muted: string;
  success: string;
  failure: string;
  pending: string;
}

export interface ReportingConfig {
  outputDir: string;
  formats: Array<'html' | 'json' | 'junit'>;
  title: string;
  theme: 'dark' | 'light';
  colors: Partial<ReportingThemeColors>;
  customCss?: string;
  metadata: Record<string, string>;
}

export interface MediaScreenshotsConfig {
  capture: ScreenshotCaptureMode;
  outputDir: string;
}

export interface MediaVideoConfig {
  record: VideoCaptureMode;
  outputDir: string;
}

export interface MediaTraceConfig {
  capture: TraceCaptureMode;
  outputDir: string;
}

export interface MediaConfig {
  screenshots: MediaScreenshotsConfig;
  video: MediaVideoConfig;
  trace: MediaTraceConfig;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

// Back-compat alias for log level strings shared with `Logger`.
export type LoggerLevel = LogLevel;

export interface LoggingConfig {
  level: LogLevel;
  console: boolean;
  colorize: boolean;
  format: 'text' | 'json';
}

export interface RetryConfig {
  count: number;
  delay: number;
  backoff: 'none' | 'linear' | 'exponential';
}

export interface PwCraftConfig {
  browser: BrowserName;
  baseUrl: string;
  defaultTimeout: number;
  navigationTimeout: number;
  headless: boolean;
  launchOptions: LaunchOptions;
  contextOptions: BrowserContextOptions;
  reporting: ReportingConfig;
  media: MediaConfig;
  /** Gherkin step / scenario attachments (Playwright testInfo, separate from built-in reporters) */
  gherkin: GherkinReportConfig;
  logging: LoggingConfig;
  retry: RetryConfig;
}

const defaultReportingColors: ReportingThemeColors = {
  primary: '#6366f1',
  surface: '#1e293b',
  background: '#0f172a',
  text: '#f8fafc',
  muted: '#94a3b8',
  success: '#22c55e',
  failure: '#ef4444',
  pending: '#eab308',
};

export const defaultConfig: PwCraftConfig = {
  browser: 'chromium',
  baseUrl: 'http://localhost:4200',
  defaultTimeout: 30_000,
  navigationTimeout: 30_000,
  headless: true,
  launchOptions: {},
  contextOptions: {
    viewport: { width: 1280, height: 720 },
  },
  reporting: {
    outputDir: 'reports',
    formats: ['html', 'json', 'junit'],
    title: 'pw-craft Report',
    theme: 'dark',
    colors: defaultReportingColors,
    customCss: undefined,
    metadata: {},
  },
  media: {
    screenshots: { capture: 'on-failure', outputDir: 'reports/screenshots' },
    video: { record: 'off', outputDir: 'reports/video' },
    trace: { capture: 'off', outputDir: 'reports/trace' },
  },
  gherkin: {
    attachments: {
      stepScreenshot: true,
      stepScreenshotFullPage: false,
      video: 'never',
      traceZip: 'on-failure',
    },
  },
  logging: {
    level: 'info',
    console: true,
    colorize: true,
    format: 'text',
  },
  retry: {
    count: 0,
    delay: 500,
    backoff: 'exponential',
  },
};

export function mergeReportingColors(
  partial?: Partial<ReportingThemeColors>,
): ReportingThemeColors {
  return { ...defaultReportingColors, ...partial };
}

export function shouldAttachScenarioArtifact(
  mode: ScenarioArtifactAttachMode,
  scenarioPassed: boolean,
): boolean {
  if (mode === 'never') return false;
  if (mode === 'always') return true;
  return !scenarioPassed;
}
