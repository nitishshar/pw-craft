import { chromium, firefox, webkit, type Browser, type BrowserContext, type Page } from '@playwright/test';
import type { PwCraftConfig } from '../config';
import { defaultConfig } from '../config';
import { deepMerge } from '../helpers/utils';

export class BrowserManager {
  private config: PwCraftConfig;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;

  constructor(partial: Partial<PwCraftConfig> = {}) {
    this.config = deepMerge(
      defaultConfig as unknown as Record<string, unknown>,
      partial as unknown as Record<string, unknown>,
    ) as unknown as PwCraftConfig;
  }

  getConfig(): PwCraftConfig {
    return this.config;
  }

  async launch(): Promise<Page> {
    const launcher =
      this.config.browser === 'firefox'
        ? firefox
        : this.config.browser === 'webkit'
          ? webkit
          : chromium;
    this.browser = await launcher.launch({
      headless: this.config.headless,
      ...this.config.launchOptions,
    });
    const videoDir =
      this.config.media.video.record === 'on' || this.config.media.video.record === 'retain-on-failure'
        ? this.config.media.video.outputDir
        : undefined;
    this.context = await this.browser.newContext({
      ...this.config.contextOptions,
      recordVideo: videoDir ? { dir: videoDir } : undefined,
    });
    this.context.setDefaultTimeout(this.config.defaultTimeout);
    this.context.setDefaultNavigationTimeout(this.config.navigationTimeout);
    this.page = await this.context.newPage();
    return this.page;
  }

  getPage(): Page {
    if (!this.page) throw new Error('BrowserManager: page not initialized. Call launch() first.');
    return this.page;
  }

  getContext(): BrowserContext {
    if (!this.context) throw new Error('BrowserManager: context not initialized. Call launch() first.');
    return this.context;
  }

  getBrowser(): Browser {
    if (!this.browser) throw new Error('BrowserManager: browser not initialized. Call launch() first.');
    return this.browser;
  }

  async newContext(options?: Parameters<Browser['newContext']>[0]): Promise<BrowserContext> {
    const ctx = await this.getBrowser().newContext({
      ...this.config.contextOptions,
      ...options,
    });
    ctx.setDefaultTimeout(this.config.defaultTimeout);
    ctx.setDefaultNavigationTimeout(this.config.navigationTimeout);
    return ctx;
  }

  async newPage(): Promise<Page> {
    const page = await this.getContext().newPage();
    this.page = page;
    return page;
  }

  async resetPage(): Promise<Page> {
    if (this.page) await this.page.close().catch(() => undefined);
    this.page = await this.getContext().newPage();
    return this.page;
  }

  async close(): Promise<void> {
    try {
      await this.context?.close();
    } finally {
      this.context = undefined;
      this.page = undefined;
    }
    try {
      await this.browser?.close();
    } finally {
      this.browser = undefined;
    }
  }
}
