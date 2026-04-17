/**
 * Maps **`process.env`** (e.g. `PWCRAFT_BASE_URL`, `PWCRAFT_BROWSER`, media flags) into a full
 * {@link PwCraftConfig} by deep-merging onto {@link defaultConfig}. Use in Playwright fixtures or
 * Node scripts after loading `.env` with `dotenv`.
 *
 * @example Playwright globalSetup or a custom runner
 * ```ts
 * import { config as loadEnv } from 'dotenv';
 * import { loadPwCraftConfigFromEnv } from 'pw-craft';
 *
 * loadEnv();
 * const pwCraft = loadPwCraftConfigFromEnv();
 * console.log(pwCraft.baseUrl, pwCraft.browser);
 * ```
 */
import type {
  BrowserName,
  PwCraftConfig,
  ScenarioArtifactAttachMode,
  TraceCaptureMode,
  VideoCaptureMode,
} from './config';
import { defaultConfig } from './config';
import { deepMerge, env, envBool, envInt } from './helpers/utils';

function parseBrowser(v: string | undefined): BrowserName | undefined {
  if (!v) return undefined;
  if (v === 'chromium' || v === 'firefox' || v === 'webkit') return v;
  return undefined;
}

function parseTrace(v: string | undefined): TraceCaptureMode | undefined {
  if (!v) return undefined;
  if (v === 'on-first-retry' || v === 'on' || v === 'off' || v === 'retain-on-failure') return v;
  return undefined;
}

function parseArtifactAttach(v: string | undefined): ScenarioArtifactAttachMode | undefined {
  if (!v) return undefined;
  if (v === 'never' || v === 'always' || v === 'on-failure') return v;
  return undefined;
}

export function loadPwCraftConfigFromEnv(): PwCraftConfig {
  const patch: Partial<PwCraftConfig> = {};
  const b = parseBrowser(process.env.PWCRAFT_BROWSER);
  if (b) patch.browser = b;
  const baseUrl = env('PWCRAFT_BASE_URL');
  if (baseUrl) patch.baseUrl = baseUrl;
  if (process.env.PWCRAFT_HEADLESS !== undefined) patch.headless = envBool('PWCRAFT_HEADLESS', defaultConfig.headless);
  const t = envInt('PWCRAFT_TIMEOUT', defaultConfig.defaultTimeout);
  patch.defaultTimeout = t;
  patch.navigationTimeout = t;

  const screenshot = process.env.PWCRAFT_SCREENSHOT_CAPTURE;
  if (screenshot === 'on-failure' || screenshot === 'always' || screenshot === 'never') {
    patch.media = {
      ...defaultConfig.media,
      screenshots: { ...defaultConfig.media.screenshots, capture: screenshot },
    };
  }

  const videoModeEnv = process.env.PWCRAFT_VIDEO_RECORD_MODE?.trim().toLowerCase();
  if (videoModeEnv === 'on' || videoModeEnv === 'off' || videoModeEnv === 'retain-on-failure') {
    patch.media = {
      ...(patch.media ?? defaultConfig.media),
      video: { ...(patch.media?.video ?? defaultConfig.media.video), record: videoModeEnv },
    };
  } else if (process.env.PWCRAFT_VIDEO_RECORD !== undefined) {
    const record: VideoCaptureMode = envBool('PWCRAFT_VIDEO_RECORD', false) ? 'on' : 'off';
    patch.media = {
      ...(patch.media ?? defaultConfig.media),
      video: { ...(patch.media?.video ?? defaultConfig.media.video), record },
    };
  }

  const trace = parseTrace(process.env.PWCRAFT_TRACE_CAPTURE);
  if (trace) {
    patch.media = {
      ...(patch.media ?? defaultConfig.media),
      trace: { ...(patch.media?.trace ?? defaultConfig.media.trace), capture: trace },
    };
  }

  if (process.env.PWCRAFT_STEP_SCREENSHOTS !== undefined) {
    patch.gherkin = {
      ...(patch.gherkin ?? defaultConfig.gherkin),
      attachments: {
        ...(patch.gherkin?.attachments ?? defaultConfig.gherkin.attachments),
        stepScreenshot: envBool('PWCRAFT_STEP_SCREENSHOTS', defaultConfig.gherkin.attachments.stepScreenshot),
      },
    };
  }

  if (process.env.PWCRAFT_STEP_SCREENSHOTS_FULL_PAGE !== undefined) {
    patch.gherkin = {
      ...(patch.gherkin ?? defaultConfig.gherkin),
      attachments: {
        ...(patch.gherkin?.attachments ?? defaultConfig.gherkin.attachments),
        stepScreenshotFullPage: envBool(
          'PWCRAFT_STEP_SCREENSHOTS_FULL_PAGE',
          defaultConfig.gherkin.attachments.stepScreenshotFullPage,
        ),
      },
    };
  }

  const attachVideo = parseArtifactAttach(process.env.PWCRAFT_ATTACH_VIDEO);
  if (attachVideo) {
    patch.gherkin = {
      ...(patch.gherkin ?? defaultConfig.gherkin),
      attachments: {
        ...(patch.gherkin?.attachments ?? defaultConfig.gherkin.attachments),
        video: attachVideo,
      },
    };
  }

  const attachTrace = parseArtifactAttach(process.env.PWCRAFT_ATTACH_TRACE_ZIP);
  if (attachTrace) {
    patch.gherkin = {
      ...(patch.gherkin ?? defaultConfig.gherkin),
      attachments: {
        ...(patch.gherkin?.attachments ?? defaultConfig.gherkin.attachments),
        traceZip: attachTrace,
      },
    };
  }

  return deepMerge(
    defaultConfig as unknown as Record<string, unknown>,
    patch as unknown as Record<string, unknown>,
  ) as unknown as PwCraftConfig;
}
