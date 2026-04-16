import { World, setWorldConstructor, type IWorldOptions } from '@cucumber/cucumber';
import * as dotenv from 'dotenv';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { ActionHelper } from '../actions/action-helper';
import { BrowserManager } from '../core/browser-manager';
import { ElementFinder } from '../elements/element-finder';
import type { PwCraftConfig } from '../config';
import { AccessibilityHelper } from '../helpers/accessibility-helper';
import { AssertHelper } from '../helpers/assert-helper';
import { Logger } from '../helpers/logger';
import { NetworkHelper } from '../helpers/network-helper';
import { StorageHelper } from '../helpers/storage-helper';
import { MediaHelper } from '../media/media-helper';
import { Navigator } from '../navigation/navigator';
import { WaitHelper } from '../waiting/wait-helper';
import { loadPwCraftConfigFromEnv } from './config-from-env';

dotenv.config();

export class PwCraftWorld extends World {
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

  private manager?: BrowserManager;
  private fullConfig!: PwCraftConfig;
  private softErrors: string[] = [];
  private traceStarted = false;

  constructor(options: IWorldOptions) {
    super(options);
    this.fullConfig = loadPwCraftConfigFromEnv();
    this.logger = new Logger({
      level: this.fullConfig.logging.level,
      colorize: this.fullConfig.logging.colorize,
      format: this.fullConfig.logging.format,
      console: this.fullConfig.logging.console,
    });
  }

  async init(scenarioName: string): Promise<void> {
    void scenarioName;
    this.manager = new BrowserManager(this.fullConfig);
    this.page = await this.manager.launch();
    this.browser = this.manager.getBrowser();
    this.context = this.manager.getContext();

    this.find = new ElementFinder(this.page);
    this.action = new ActionHelper(this.page);
    this.wait = new WaitHelper(this.page);
    this.assert = new AssertHelper(this.page);
    this.nav = new Navigator(this.page, this.fullConfig.baseUrl);
    this.media = new MediaHelper(this.page, this.fullConfig, this.logger);
    this.network = new NetworkHelper(this.page, this.context);
    this.storage = new StorageHelper(this.page, this.context);
    this.a11y = new AccessibilityHelper(this.page);
    this.media.listenToConsole();

    const traceMode = this.fullConfig.media.trace.capture;
    if (traceMode !== 'off') {
      try {
        await this.media.startTrace();
        this.traceStarted = true;
      } catch {
        this.traceStarted = false;
      }
    }
    this.softErrors = [];
  }

  async teardown(passed: boolean): Promise<void> {
    try {
      if (this.traceStarted) {
        const tracePath = await this.media.stopTrace('trace').catch(() => undefined);
        if (
          tracePath &&
          passed &&
          this.fullConfig.media.trace.capture === 'retain-on-failure'
        ) {
          const fs = await import('node:fs/promises');
          await fs.rm(tracePath, { force: true }).catch(() => undefined);
        }
      }
    } finally {
      await this.manager?.close().catch(() => undefined);
      this.manager = undefined;
      this.traceStarted = false;
      this.softErrors = [];
    }
  }

  async stepScreenshot(stepName: string): Promise<void> {
    const file = await this.media.screenshotWithTimestamp(`step-${stepName}`);
    await this.attachScreenshot(file);
  }

  async attachScreenshot(filePath: string): Promise<void> {
    const fs = await import('node:fs/promises');
    const buf = await fs.readFile(filePath);
    await this.attach(buf, 'image/png');
  }

  async attachText(text: string, contentType = 'text/plain'): Promise<void> {
    await this.attach(text, contentType);
  }

  softAssert(cond: boolean, msg: string): void {
    this.assert.softAssert(cond, msg, this.softErrors);
  }

  throwSoftAssertions(): void {
    this.assert.throwSoftAssertions(this.softErrors);
    this.softErrors = [];
  }
}

setWorldConstructor(PwCraftWorld);
