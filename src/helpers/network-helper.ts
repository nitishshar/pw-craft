import type { BrowserContext, Page, Request, Response, Route } from '@playwright/test';

type MockBody = string | Buffer | object;

export class NetworkHelper {
  private capturedRequests: Request[] = [];
  private capturedResponses: Response[] = [];

  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
  ) {}

  async mockApiResponse(url: string | RegExp, mock: { status?: number; body?: MockBody; headers?: Record<string, string> }): Promise<void> {
    await this.context.route(url, async (route: Route) => {
      const body =
        mock.body === undefined
          ? ''
          : typeof mock.body === 'object' && !Buffer.isBuffer(mock.body)
            ? JSON.stringify(mock.body)
            : (mock.body as string | Buffer);
      await route.fulfill({
        status: mock.status ?? 200,
        body,
        headers: { 'content-type': 'application/json', ...mock.headers },
      });
    });
  }

  async mockSequential(url: string | RegExp, mocks: Array<{ status?: number; body?: MockBody }>): Promise<void> {
    let i = 0;
    await this.context.route(url, async (route) => {
      const mock = mocks[Math.min(i++, mocks.length - 1)]!;
      const body =
        mock.body === undefined
          ? '{}'
          : typeof mock.body === 'object' && !Buffer.isBuffer(mock.body)
            ? JSON.stringify(mock.body)
            : (mock.body as string | Buffer);
      await route.fulfill({
        status: mock.status ?? 200,
        body,
        headers: { 'content-type': 'application/json' },
      });
    });
  }

  async mockEmpty(url: string | RegExp): Promise<void> {
    await this.mockApiResponse(url, { status: 204, body: '' });
  }

  async mockError(url: string | RegExp, status = 500): Promise<void> {
    await this.context.route(url, async (route) => {
      await route.fulfill({ status, body: 'error' });
    });
  }

  async mockTimeout(url: string | RegExp, ms: number): Promise<void> {
    await this.context.route(url, async (route) => {
      await new Promise((r) => setTimeout(r, ms));
      await route.abort('timedout');
    });
  }

  async mockAbort(url: string | RegExp): Promise<void> {
    await this.context.route(url, async (route) => {
      await route.abort('failed');
    });
  }

  async addDelay(url: string | RegExp, ms: number): Promise<void> {
    await this.context.route(url, async (route) => {
      await new Promise((r) => setTimeout(r, ms));
      await route.continue();
    });
  }

  async modifyRequest(
    url: string | RegExp,
    modifier: (req: Request) => Promise<{ headers?: Record<string, string>; postData?: string } | void> | { headers?: Record<string, string>; postData?: string } | void,
  ): Promise<void> {
    await this.context.route(url, async (route) => {
      const req = route.request();
      const patch = await modifier(req);
      await route.continue({
        headers: patch?.headers,
        postData: patch?.postData,
      });
    });
  }

  async injectAuthHeader(token: string, headerName = 'Authorization', scheme = 'Bearer'): Promise<void> {
    await this.context.setExtraHTTPHeaders({
      [headerName]: `${scheme} ${token}`.trim(),
    });
  }

  async captureRequests(pattern?: string | RegExp): Promise<void> {
    this.page.on('request', (req) => {
      if (!pattern) this.capturedRequests.push(req);
      else if (typeof pattern === 'string' && req.url().includes(pattern)) this.capturedRequests.push(req);
      else if (pattern instanceof RegExp && pattern.test(req.url())) this.capturedRequests.push(req);
    });
  }

  async captureResponses(pattern?: string | RegExp): Promise<void> {
    this.page.on('response', (res) => {
      if (!pattern) this.capturedResponses.push(res);
      else if (typeof pattern === 'string' && res.url().includes(pattern)) this.capturedResponses.push(res);
      else if (pattern instanceof RegExp && pattern.test(res.url())) this.capturedResponses.push(res);
    });
  }

  getCapturedRequests(): Request[] {
    return [...this.capturedRequests];
  }

  getCapturedResponses(): Response[] {
    return [...this.capturedResponses];
  }

  async waitForCapturedRequest(predicate: (r: Request) => boolean, timeout = 30_000): Promise<Request> {
    return await this.page.waitForEvent('request', {
      predicate,
      timeout,
    });
  }

  clearCaptures(): void {
    this.capturedRequests = [];
    this.capturedResponses = [];
  }

  async simulateOffline(): Promise<void> {
    await this.context.setOffline(true);
  }

  async simulateOnline(): Promise<void> {
    await this.context.setOffline(false);
  }

  async unrouteAll(): Promise<void> {
    await this.context.unrouteAll({ behavior: 'ignoreErrors' });
  }

  async unroute(url: string | RegExp): Promise<void> {
    await this.context.unroute(url);
  }
}
