import type { Download, Locator, Page, Request, Response } from '@playwright/test';
import { expect } from '@playwright/test';
import { sleep } from '../helpers/utils';

export class WaitHelper {
  constructor(private readonly page: Page) {}

  async forVisible(target: string | Locator, timeout?: number): Promise<void> {
    await this.resolve(target).waitFor({ state: 'visible', timeout });
  }

  async forHidden(target: string | Locator, timeout?: number): Promise<void> {
    await this.resolve(target).waitFor({ state: 'hidden', timeout });
  }

  async forAttached(target: string | Locator, timeout?: number): Promise<void> {
    await this.resolve(target).waitFor({ state: 'attached', timeout });
  }

  async forDetached(target: string | Locator, timeout?: number): Promise<void> {
    await this.resolve(target).waitFor({ state: 'detached', timeout });
  }

  async forEnabled(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeEnabled({ timeout });
  }

  async forDisabled(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeDisabled({ timeout });
  }

  async forCount(target: string | Locator, count: number, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveCount(count, { timeout });
  }

  async forCountAtLeast(target: string | Locator, min: number, timeout = 30_000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const n = await this.resolve(target).count();
      if (n >= min) return;
      await sleep(50);
    }
    throw new Error(`forCountAtLeast: still < ${min} after ${timeout}ms`);
  }

  async forText(target: string | Locator, text: string | RegExp, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toContainText(text, { timeout });
  }

  async forExactText(target: string | Locator, text: string, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveText(text, { timeout });
  }

  async forInputValue(target: string | Locator, value: string | RegExp, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveValue(value, { timeout });
  }

  async forAttribute(
    target: string | Locator,
    name: string,
    value: string | RegExp,
    timeout?: number,
  ): Promise<void> {
    await expect(this.resolve(target)).toHaveAttribute(name, value, { timeout });
  }

  async forClass(target: string | Locator, className: string, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveClass(new RegExp(`(^|\\s)${escapeRe(className)}(\\s|$)`), { timeout });
  }

  async forClassRemoved(target: string | Locator, className: string, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).not.toHaveClass(new RegExp(`(^|\\s)${escapeRe(className)}(\\s|$)`), {
      timeout,
    });
  }

  async forLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load'): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  async forNetworkIdle(timeout?: number): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async forUrl(pattern: string | RegExp, timeout?: number): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  async forNavigation(timeout?: number): Promise<void> {
    await this.page.waitForLoadState('load', { timeout });
  }

  async forRequest(url: string | RegExp, timeout?: number): Promise<Request> {
    return await this.page.waitForRequest(url, { timeout });
  }

  async forResponse(url: string | RegExp, timeout?: number): Promise<Response> {
    return await this.page.waitForResponse(url, { timeout });
  }

  async forResponseWithStatus(url: string | RegExp, status: number, timeout?: number): Promise<Response> {
    return await this.page.waitForResponse(
      (res) => {
        const ok = typeof url === 'string' ? res.url().includes(url) : url.test(res.url());
        return ok && res.status() === status;
      },
      { timeout },
    );
  }

  async forAngularReady(timeout = 30_000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const w = globalThis as unknown as {
          getAllAngularTestabilities?: () => Array<{ isStable?: () => boolean }>;
        };
        const all = w.getAllAngularTestabilities?.() ?? [];
        return all.length > 0 && all.every((t) => t.isStable?.() === true);
      },
      undefined,
      { timeout },
    );
  }

  async forAngularRouteChange(timeout = 30_000): Promise<void> {
    await this.forAngularReady(timeout);
    await sleep(50);
  }

  async forAngularSpinnerGone(selector = '[data-testid="loading-spinner"]', timeout = 30_000): Promise<void> {
    const loc = this.page.locator(selector);
    const count = await loc.count();
    if (count === 0) return;
    await loc.first().waitFor({ state: 'detached', timeout }).catch(async () => {
      await expect(loc).toHaveCount(0, { timeout });
    });
  }

  async forAnimationEnd(locator: string | Locator, timeout = 30_000): Promise<void> {
    const handle = await this.resolve(locator).elementHandle({ timeout });
    if (!handle) throw new Error('forAnimationEnd: element not found');
    await handle.evaluate((el) =>
      Promise.all(
        (el as HTMLElement).getAnimations().map((a) => a.finished),
      ),
    );
    await handle.dispose();
  }

  async forAnimationsComplete(timeout = 30_000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const els = Array.from(document.querySelectorAll('*')) as HTMLElement[];
        return els.every((el) =>
          el.getAnimations().every((a: Animation) => a.playState === 'finished' || a.playState === 'idle'),
        );
      },
      undefined,
      { timeout },
    );
  }

  async forTimeout(ms: number): Promise<void> {
    await sleep(ms);
  }

  async until(
    condition: () => Promise<boolean> | boolean,
    opts?: { timeout?: number; interval?: number },
  ): Promise<void> {
    const timeout = opts?.timeout ?? 30_000;
    const interval = opts?.interval ?? 50;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) return;
      await sleep(interval);
    }
    throw new Error('until: condition not met');
  }

  async forValue<T>(
    getter: () => Promise<T> | T,
    predicate: (v: T) => boolean,
    timeout = 30_000,
  ): Promise<T> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const v = await getter();
      if (predicate(v)) return v;
      await sleep(50);
    }
    throw new Error('forValue: predicate not satisfied');
  }

  async forPageFunction<T>(fn: () => T, opts?: { timeout?: number; polling?: number }): Promise<T> {
    return (await this.page.waitForFunction(fn, undefined, {
      timeout: opts?.timeout,
      polling: opts?.polling,
    })) as unknown as T;
  }

  async forDialog(action: 'accept' | 'dismiss', text?: string): Promise<void> {
    const dialog = await this.page.waitForEvent('dialog');
    if (text) expect(dialog.message()).toContain(text);
    if (action === 'accept') await dialog.accept();
    else await dialog.dismiss();
  }

  async forNewPage(trigger: () => Promise<void>): Promise<Page> {
    const ctx = this.page.context();
    const [newPage] = await Promise.all([ctx.waitForEvent('page'), trigger()]);
    await newPage.waitForLoadState();
    return newPage;
  }

  async forDownload(trigger: () => Promise<void>): Promise<Download> {
    const [download] = await Promise.all([this.page.waitForEvent('download'), trigger()]);
    return download;
  }

  private resolve(target: string | Locator): Locator {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
