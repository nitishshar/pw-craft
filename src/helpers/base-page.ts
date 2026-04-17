/**
 * **Page object** base class: wires {@link ElementFinder}, {@link ActionHelper}, {@link WaitHelper},
 * {@link AssertHelper}, {@link Navigator}, and {@link Logger} for a single `Page` + `baseUrl`.
 * Subclasses implement {@link BasePage.navigate} (e.g. open `/products`) and can add domain methods.
 *
 * @example
 * ```ts
 * import type { Page } from '@playwright/test';
 * import { BasePage } from 'pw-craft';
 *
 * export class HomePage extends BasePage {
 *   async navigate(): Promise<void> {
 *     await this.nav.goto('/');
 *   }
 *
 *   async expectHero(): Promise<void> {
 *     await this.assert.textContains(this.find.byTestId('home-hero-title'), /pw-craft/i);
 *   }
 * }
 *
 * // const home = new HomePage(page, 'http://localhost:4200');
 * // await home.navigate();
 * // await home.expectHero();
 * ```
 */
import type { Page } from '@playwright/test';
import { ActionHelper } from '../actions/action-helper';
import { ElementFinder } from '../elements/element-finder';
import { Navigator } from '../navigation/navigator';
import { WaitHelper } from '../waiting/wait-helper';
import { AssertHelper } from './assert-helper';
import { Logger } from './logger';

export abstract class BasePage {
  protected readonly find: ElementFinder;
  protected readonly action: ActionHelper;
  protected readonly wait: WaitHelper;
  protected readonly assert: AssertHelper;
  protected readonly nav: Navigator;
  protected readonly logger: Logger;

  constructor(
    protected readonly page: Page,
    protected readonly baseUrl: string,
    logger?: Logger,
  ) {
    this.logger = logger ?? new Logger();
    this.find = new ElementFinder(page);
    this.action = new ActionHelper(page);
    this.wait = new WaitHelper(page);
    this.assert = new AssertHelper(page);
    this.nav = new Navigator(page, baseUrl);
  }

  abstract navigate(): Promise<void> | void;

  async waitForReady(): Promise<void> {
    await this.wait.forLoadState('domcontentloaded');
  }

  async screenshot(_name?: string): Promise<Buffer> {
    return await this.page.screenshot({ fullPage: true });
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async scrollToTop(): Promise<void> {
    await this.action.scrollToTop();
  }

  async scrollToBottom(): Promise<void> {
    await this.action.scrollToBottom();
  }

  async hasElement(sel: string): Promise<boolean> {
    return (await this.page.locator(sel).count()) > 0;
  }
}
