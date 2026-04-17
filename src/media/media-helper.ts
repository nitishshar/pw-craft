/**
 * **Artifacts** tied to {@link PwCraftConfig}: disk screenshots (full page, element, highlighted),
 * **trace** start/stop to zip, **video** path helpers, **HTML** capture, and **console** log collection.
 * Used by {@link PwCraftSession} for Gherkin attachments and failure diagnostics.
 *
 * @example Timestamped screenshot for a step
 * ```ts
 * import { MediaHelper } from 'pw-craft';
 * import { defaultConfig } from 'pw-craft';
 * import { Logger } from 'pw-craft';
 *
 * const logger = new Logger();
 * const media = new MediaHelper(page, defaultConfig, logger);
 * const file = await media.screenshotWithTimestamp('after-checkout');
 * ```
 */
import type { Page } from '@playwright/test';
import type { PwCraftConfig } from '../config';
import type { Logger } from '../helpers/logger';
import { formatDateForFilename, sanitizeFilename } from '../helpers/utils';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export class MediaHelper {
  private consoleLogs: string[] = [];

  constructor(
    private readonly page: Page,
    private readonly config: PwCraftConfig,
    private readonly logger: Logger,
  ) {}

  async screenshot(name?: string): Promise<string> {
    const dir = this.config.media.screenshots.outputDir;
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${sanitizeFilename(name ?? 'screenshot')}.png`);
    await this.page.screenshot({ path: file, fullPage: true });
    return file;
  }

  async screenshotElement(locator: import('@playwright/test').Locator, name?: string): Promise<string> {
    const dir = this.config.media.screenshots.outputDir;
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${sanitizeFilename(name ?? 'element')}.png`);
    await locator.screenshot({ path: file });
    return file;
  }

  async screenshotWithHighlight(
    locator: import('@playwright/test').Locator,
    name?: string,
    style?: { color?: string; width?: number },
  ): Promise<string> {
    await locator.evaluate(
      (el, s) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.outline = `${s.width ?? 3}px solid ${s.color ?? '#f97316'}`;
      },
      { color: style?.color, width: style?.width },
    );
    try {
      return await this.screenshotElement(locator, name);
    } finally {
      await locator.evaluate((el) => {
        (el as HTMLElement).style.outline = '';
      });
    }
  }

  async screenshotWithAnnotation(name: string, annotation: string): Promise<string> {
    const dir = this.config.media.screenshots.outputDir;
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${sanitizeFilename(name)}.png`);
    await this.page.screenshot({ path: file, fullPage: true });
    this.logger.info(`Annotation: ${annotation}`);
    return file;
  }

  private lastShot?: string;

  async screenshotBefore(name: string): Promise<string> {
    this.lastShot = await this.screenshot(`${name}-before`);
    return this.lastShot;
  }

  async screenshotAfter(name: string): Promise<string> {
    return await this.screenshot(`${name}-after`);
  }

  async screenshotOnFailure(name: string, error: unknown): Promise<string> {
    const dir = this.config.media.screenshots.outputDir;
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${sanitizeFilename(name)}-failure.png`);
    await this.page.screenshot({ path: file, fullPage: true }).catch(() => undefined);
    this.logger.error(`screenshotOnFailure: ${String(error)}`);
    return file;
  }

  async screenshotWithTimestamp(name?: string): Promise<string> {
    const stamp = formatDateForFilename();
    return await this.screenshot(`${name ?? 'shot'}-${stamp}`);
  }

  async getVideoPath(): Promise<string | undefined> {
    try {
      const vid = this.page.video();
      return vid ? await vid.path() : undefined;
    } catch {
      return undefined;
    }
  }

  async saveVideo(dest: string): Promise<void> {
    const vid = this.page.video();
    if (!vid) return;
    const src = await vid.path();
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }

  async deleteVideo(): Promise<void> {
    const p = await this.getVideoPath();
    if (p) await fs.rm(p, { force: true });
  }

  async startTrace(opts?: { screenshots?: boolean; snapshots?: boolean; sources?: boolean }): Promise<void> {
    await this.page.context().tracing.start({
      screenshots: opts?.screenshots ?? true,
      snapshots: opts?.snapshots ?? true,
      sources: opts?.sources ?? true,
    });
  }

  async stopTrace(name: string): Promise<string> {
    const dir = this.config.media.trace.outputDir;
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${sanitizeFilename(name)}.zip`);
    await this.page.context().tracing.stop({ path: file });
    return file;
  }

  async captureHtml(name?: string): Promise<string> {
    const dir = this.config.reporting.outputDir;
    await fs.mkdir(dir, { recursive: true });
    const html = await this.page.content();
    const file = path.join(dir, `${sanitizeFilename(name ?? 'page')}.html`);
    await fs.writeFile(file, html, 'utf8');
    return file;
  }

  listenToConsole(): void {
    this.page.on('console', (msg) => {
      this.consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
  }

  getConsoleLogs(): string[] {
    return [...this.consoleLogs];
  }

  clearConsoleLogs(): void {
    this.consoleLogs = [];
  }
}
