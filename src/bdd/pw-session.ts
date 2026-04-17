/**
 * **One instance per Gherkin scenario** (playwright-bdd): exposes the same helpers as typical tests
 * (`find`, `action`, `wait`, `assert`, `nav`, `network`, `storage`, `a11y`, `media`) and coordinates
 * **trace**, **console log**, and **failure screenshot** attachments on {@link PwCraftSession.teardown}.
 *
 * Constructed from Playwright `testInfo`, merged {@link PwCraftConfig}, and the scenario's
 * `page` / `context` / `browser`.
 *
 * @example Step definitions (simplified)
 * ```ts
 * import { PwCraftSession } from 'pw-craft';
 * // In a Before hook: const session = new PwCraftSession(testInfo, config, page, context, browser);
 * // await session.ready();
 * // In steps: await session.nav.goto('/'); await session.assert.textContains(session.find.byTestId('x'), 'y');
 * // After: await session.teardown(passed);
 * ```
 */
import type { Browser, BrowserContext, Page, TestInfo } from '@playwright/test';
import { ActionHelper } from '../actions/action-helper';
import { shouldAttachScenarioArtifact, type PwCraftConfig } from '../config';
import { AccessibilityHelper } from '../helpers/accessibility-helper';
import { AssertHelper } from '../helpers/assert-helper';
import { Logger } from '../helpers/logger';
import { NetworkHelper } from '../helpers/network-helper';
import { StorageHelper } from '../helpers/storage-helper';
import { MediaHelper } from '../media/media-helper';
import { Navigator } from '../navigation/navigator';
import { ElementFinder } from '../elements/element-finder';
import { WaitHelper } from '../waiting/wait-helper';

export class PwCraftSession {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  find!: ElementFinder;
  action!: ActionHelper;
  wait!: WaitHelper;
  assert!: AssertHelper;
  nav!: Navigator;
  media!: MediaHelper;
  network!: NetworkHelper;
  storage!: StorageHelper;
  a11y!: AccessibilityHelper;
  logger!: Logger;

  private readonly softErrors: string[] = [];
  private traceStarted = false;
  private attachSeq = 0;

  constructor(
    private readonly testInfo: TestInfo,
    readonly pwCraftConfig: PwCraftConfig,
    page: Page,
    context: BrowserContext,
    browser: Browser,
  ) {
    this.page = page;
    this.context = context;
    this.browser = browser;
    this.logger = new Logger({
      level: pwCraftConfig.logging.level,
      colorize: pwCraftConfig.logging.colorize,
      format: pwCraftConfig.logging.format,
      console: pwCraftConfig.logging.console,
    });
    this.find = new ElementFinder(page);
    this.action = new ActionHelper(page);
    this.wait = new WaitHelper(page);
    this.assert = new AssertHelper(page);
    this.nav = new Navigator(page, pwCraftConfig.baseUrl);
    this.media = new MediaHelper(page, pwCraftConfig, this.logger);
    this.network = new NetworkHelper(page, context);
    this.storage = new StorageHelper(page, context);
    this.a11y = new AccessibilityHelper(page);
  }

  async ready(): Promise<void> {
    this.media.listenToConsole();
    const traceMode = this.pwCraftConfig.media.trace.capture;
    if (traceMode !== 'off') {
      try {
        await this.media.startTrace();
        this.traceStarted = true;
      } catch {
        this.traceStarted = false;
      }
    }
    this.softErrors.length = 0;
  }

  async teardown(passed: boolean): Promise<void> {
    const att = this.pwCraftConfig.gherkin.attachments;
    const fs = await import('node:fs/promises');
    let tracePath: string | undefined;

    try {
      const logs = this.media.getConsoleLogs().join('\n');
      if (logs) {
        await this.attachText(logs, 'text/plain').catch(() => undefined);
      }
    } catch {
      // ignore
    }

    if (!passed) {
      try {
        const buf = await this.page?.screenshot({ fullPage: true });
        if (buf) await this.attach(buf, 'image/png', 'failure-screenshot.png').catch(() => undefined);
      } catch {
        // ignore
      }
    }

    try {
      if (this.traceStarted) {
        tracePath = await this.media.stopTrace('trace').catch(() => undefined);
        if (tracePath && shouldAttachScenarioArtifact(att.traceZip, passed)) {
          await this.attachFileFromPath(tracePath, 'application/zip', 'trace.zip').catch(() => undefined);
        }
        if (tracePath && passed && this.pwCraftConfig.media.trace.capture === 'retain-on-failure') {
          await fs.rm(tracePath, { force: true }).catch(() => undefined);
        }
      }
    } finally {
      this.traceStarted = false;
      this.softErrors.length = 0;
    }
  }

  async attach(data: Buffer | string, mime: string, nameHint = 'attachment'): Promise<void> {
    const name = `${nameHint}-${++this.attachSeq}`;
    await this.testInfo.attach(name, { body: data, contentType: mime });
  }

  private async attachFileFromPath(filePath: string, mediaType: string, nameHint: string): Promise<void> {
    const fs = await import('node:fs/promises');
    const buf = await fs.readFile(filePath);
    await this.attach(buf, mediaType, nameHint);
  }

  async attachScreenshot(filePath: string): Promise<void> {
    const fs = await import('node:fs/promises');
    const buf = await fs.readFile(filePath);
    await this.attach(buf, 'image/png', 'screenshot');
  }

  async attachText(text: string, contentType = 'text/plain'): Promise<void> {
    await this.attach(text, contentType, 'log');
  }

  async stepScreenshot(stepName: string): Promise<void> {
    const file = await this.media.screenshotWithTimestamp(`step-${stepName}`);
    await this.attachScreenshot(file);
  }

  softAssert(cond: boolean, msg: string): void {
    this.assert.softAssert(cond, msg, this.softErrors);
  }

  throwSoftAssertions(): void {
    this.assert.throwSoftAssertions(this.softErrors);
    this.softErrors.length = 0;
  }
}
