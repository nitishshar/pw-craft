import type { BrowserContext, Page } from '@playwright/test';

export class StorageHelper {
  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
  ) {}

  async localGet(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  async localSet(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: value });
  }

  async localRemove(key: string): Promise<void> {
    await this.page.evaluate((k) => localStorage.removeItem(k), key);
  }

  async localClear(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }

  async localSetJson(key: string, value: unknown): Promise<void> {
    await this.localSet(key, JSON.stringify(value));
  }

  async localGetJson<T>(key: string): Promise<T | null> {
    const raw = await this.localGet(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  async getAllLocalStorage(): Promise<Record<string, string>> {
    return await this.page.evaluate(() => ({ ...localStorage }));
  }

  async saveState(): Promise<Record<string, string>> {
    return await this.getAllLocalStorage();
  }

  async restoreState(state: Record<string, string>): Promise<void> {
    await this.localClear();
    for (const [k, v] of Object.entries(state)) await this.localSet(k, v);
  }

  async sessionGet(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => sessionStorage.getItem(k), key);
  }

  async sessionSet(key: string, value: string): Promise<void> {
    await this.page.evaluate(({ k, v }) => sessionStorage.setItem(k, v), { k: key, v: value });
  }

  async sessionRemove(key: string): Promise<void> {
    await this.page.evaluate((k) => sessionStorage.removeItem(k), key);
  }

  async sessionClear(): Promise<void> {
    await this.page.evaluate(() => sessionStorage.clear());
  }

  async setCookie(cookie: Parameters<BrowserContext['addCookies']>[0][number]): Promise<void> {
    await this.context.addCookies([cookie]);
  }

  async getCookie(name: string): Promise<{ name: string; value: string } | undefined> {
    const cookies = await this.context.cookies();
    return cookies.find((c) => c.name === name);
  }

  async getAllCookies(): Promise<Awaited<ReturnType<BrowserContext['cookies']>>> {
    return await this.context.cookies();
  }

  async deleteCookie(name: string, url?: string): Promise<void> {
    await this.context.clearCookies({ name, ...(url ? { url } : {}) });
  }

  async clearAllCookies(): Promise<void> {
    await this.context.clearCookies();
  }

  async setAuthCookie(name: string, value: string, url: string): Promise<void> {
    await this.context.addCookies([{ name, value, url }]);
  }

  async clearAll(): Promise<void> {
    await this.localClear();
    await this.sessionClear();
    await this.clearAllCookies();
  }
}
