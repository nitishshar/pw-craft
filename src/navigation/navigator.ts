/**
 * URL helpers on top of Playwright's `Page`: **goto** with query/hash, **route templates** (`:id`),
 * back/forward/reload, **assert** current URL, **waitForURL**, and simple **multi-tab** utilities.
 * Paths are resolved against the constructor `baseUrl` unless you pass an absolute `http(s)` URL.
 *
 * @example Navigate with query string and assert URL
 * ```ts
 * import { Navigator } from 'pw-craft';
 *
 * const nav = new Navigator(page, 'http://localhost:4200');
 * await nav.goto('/search', { query: { q: 'widgets' } });
 * await nav.assertCurrentUrl(/q=widgets/, 'contains');
 * ```
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type UrlAssertMode = 'exact' | 'contains' | 'startsWith' | 'regex';

export interface HistoryState {
  url: string;
  at: string;
}

export interface GotoOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  hash?: string;
  waitUntil?: NonNullable<Parameters<Page['goto']>[1]>['waitUntil'];
  timeout?: number;
}

export class Navigator {
  private readonly history: HistoryState[] = [];

  constructor(
    private readonly page: Page,
    private readonly baseUrl: string,
  ) {}

  private normalizeBase(): string {
    return this.baseUrl.replace(/\/$/, '');
  }

  private resolve(urlOrPath: string): string {
    if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
    const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
    return `${this.normalizeBase()}${path}`;
  }

  private pushHistory(url: string): void {
    this.history.push({ url, at: new Date().toISOString() });
    if (this.history.length > 200) this.history.shift();
  }

  async goto(urlOrPath: string, opts: GotoOptions = {}): Promise<void> {
    const u = new URL(this.resolve(urlOrPath));
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v === undefined || v === null) continue;
        u.searchParams.set(k, String(v));
      }
    }
    if (opts.hash) {
      u.hash = opts.hash.startsWith('#') ? opts.hash : `#${opts.hash}`;
    }
    await this.page.goto(u.toString(), {
      waitUntil: opts.waitUntil ?? 'load',
      timeout: opts.timeout,
    });
    this.pushHistory(u.toString());
  }

  async gotoRoute(template: string, params: Record<string, string | number>): Promise<void> {
    let path = template;
    for (const [k, v] of Object.entries(params)) {
      path = path.replaceAll(`:${k}`, encodeURIComponent(String(v)));
    }
    await this.goto(path);
  }

  async goBack(): Promise<void> {
    await this.page.goBack();
    this.pushHistory(this.page.url());
  }

  async goForward(): Promise<void> {
    await this.page.goForward();
    this.pushHistory(this.page.url());
  }

  async reload(): Promise<void> {
    await this.page.reload();
    this.pushHistory(this.page.url());
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  getPath(): string {
    try {
      return new URL(this.page.url()).pathname;
    } catch {
      return '';
    }
  }

  getHash(): string {
    try {
      return new URL(this.page.url()).hash.replace(/^#/, '');
    } catch {
      return '';
    }
  }

  getQueryParam(key: string): string | null {
    try {
      return new URL(this.page.url()).searchParams.get(key);
    } catch {
      return null;
    }
  }

  getAllQueryParams(): Record<string, string> {
    const out: Record<string, string> = {};
    try {
      const sp = new URL(this.page.url()).searchParams;
      sp.forEach((v, k) => {
        out[k] = v;
      });
    } catch {
      // ignore
    }
    return out;
  }

  async assertCurrentUrl(expected: string | RegExp, mode: UrlAssertMode = 'exact'): Promise<void> {
    const url = this.page.url();
    if (mode === 'exact') expect(url).toBe(expected);
    else if (mode === 'contains') expect(url).toContain(String(expected));
    else if (mode === 'startsWith') expect(url.startsWith(String(expected))).toBeTruthy();
    else expect(url).toMatch(expected as RegExp);
  }

  async waitForUrl(pattern: string | RegExp, timeout?: number): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  async openInNewTab(url: string): Promise<Page> {
    const ctx = this.page.context();
    const p = await ctx.newPage();
    await p.goto(this.resolve(url));
    return p;
  }

  getAllPages(): Page[] {
    return this.page.context().pages();
  }

  async switchToTab(index: number): Promise<Page> {
    const pages = this.getAllPages();
    const p = pages[index];
    if (!p) throw new Error(`No tab at index ${index}`);
    await p.bringToFront();
    return p;
  }

  async closeOtherTabs(): Promise<void> {
    const pages = this.getAllPages();
    for (const p of pages) {
      if (p !== this.page) await p.close().catch(() => undefined);
    }
  }

  getNavigationHistory(): HistoryState[] {
    return [...this.history];
  }
}
