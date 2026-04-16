import type { BrowserName, PwCraftConfig, TraceCaptureMode, VideoCaptureMode } from '../config';
import { defaultConfig } from '../config';
import { deepMerge, env, envBool, envInt } from '../helpers/utils';

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

  if (process.env.PWCRAFT_VIDEO_RECORD !== undefined) {
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

  return deepMerge(
    defaultConfig as unknown as Record<string, unknown>,
    patch as unknown as Record<string, unknown>,
  ) as unknown as PwCraftConfig;
}
