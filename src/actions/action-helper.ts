import type { Locator, Page } from '@playwright/test';
import { sleep } from '../helpers/utils';

export class ActionHelper {
  constructor(private readonly page: Page) {}

  async click(target: string | Locator, options?: Parameters<Locator['click']>[0]): Promise<void> {
    await this.resolve(target).click(options);
  }

  async doubleClick(target: string | Locator, options?: Parameters<Locator['dblclick']>[0]): Promise<void> {
    await this.resolve(target).dblclick(options);
  }

  async rightClick(target: string | Locator, options?: Parameters<Locator['click']>[0]): Promise<void> {
    await this.resolve(target).click({ ...options, button: 'right' });
  }

  async forceClick(target: string | Locator): Promise<void> {
    await this.resolve(target).click({ force: true });
  }

  async clickAt(x: number, y: number): Promise<void> {
    await this.page.mouse.click(x, y);
  }

  async clickAndHold(ms: number): Promise<void> {
    await this.page.mouse.down();
    await sleep(ms);
    await this.page.mouse.up();
  }

  async clickWithModifier(
    target: string | Locator,
    modifier: 'Alt' | 'Control' | 'Meta' | 'Shift',
    options?: Parameters<Locator['click']>[0],
  ): Promise<void> {
    await this.resolve(target).click({ ...options, modifiers: [modifier] });
  }

  async fill(target: string | Locator, value: string, options?: Parameters<Locator['fill']>[1]): Promise<void> {
    await this.resolve(target).fill(value, options);
  }

  async type(target: string | Locator, value: string, options?: Parameters<Locator['pressSequentially']>[1]): Promise<void> {
    await this.resolve(target).pressSequentially(value, options);
  }

  async typeSlowly(target: string | Locator, value: string, delayMs: number): Promise<void> {
    await this.resolve(target).pressSequentially(value, { delay: delayMs });
  }

  async clear(target: string | Locator): Promise<void> {
    const loc = this.resolve(target);
    await loc.fill('');
  }

  async fillAndPress(target: string | Locator, value: string, key: string): Promise<void> {
    const loc = this.resolve(target);
    await loc.fill(value);
    await loc.press(key);
  }

  async fillAndSubmit(target: string | Locator, value: string): Promise<void> {
    await this.fillAndPress(target, value, 'Enter');
  }

  async replaceText(target: string | Locator, value: string): Promise<void> {
    const loc = this.resolve(target);
    await loc.click();
    await this.page.keyboard.press('ControlOrMeta+A');
    await loc.fill(value);
  }

  async hover(target: string | Locator, options?: Parameters<Locator['hover']>[0]): Promise<void> {
    await this.resolve(target).hover(options);
  }

  async hoverAndWait(selector: string | Locator, timeout: number): Promise<void> {
    await this.resolve(selector).hover();
    await sleep(timeout);
  }

  async dragAndDrop(source: string | Locator, dest: string | Locator): Promise<void> {
    await this.resolve(source).dragTo(this.resolve(dest));
  }

  async dragToCoordinates(source: string | Locator, x: number, y: number): Promise<void> {
    const box = await this.resolve(source).boundingBox();
    if (!box) throw new Error('dragToCoordinates: source not visible');
    await this.resolve(source).hover();
    await this.page.mouse.down();
    await this.page.mouse.move(x, y);
    await this.page.mouse.up();
  }

  async reorderListItem(
    item: string | Locator,
    direction: 'up' | 'down',
    steps: number,
  ): Promise<void> {
    const loc = this.resolve(item);
    const key = direction === 'up' ? 'ArrowUp' : 'ArrowDown';
    await loc.click();
    for (let i = 0; i < steps; i++) await this.page.keyboard.press(key);
  }

  async selectOption(
    target: string | Locator,
    values: string | string[] | { label?: string; value?: string; index?: number },
  ): Promise<void> {
    await this.resolve(target).selectOption(values as Parameters<Locator['selectOption']>[0]);
  }

  async selectMultipleOptions(target: string | Locator, values: string[]): Promise<void> {
    await this.resolve(target).selectOption(values);
  }

  async check(target: string | Locator, options?: Parameters<Locator['check']>[0]): Promise<void> {
    await this.resolve(target).check(options);
  }

  async uncheck(target: string | Locator, options?: Parameters<Locator['uncheck']>[0]): Promise<void> {
    await this.resolve(target).uncheck(options);
  }

  async setCheckbox(target: string | Locator, checked: boolean): Promise<void> {
    if (checked) await this.check(target);
    else await this.uncheck(target);
  }

  async selectRadio(target: string | Locator): Promise<void> {
    await this.resolve(target).check();
  }

  async scrollIntoView(target: string | Locator): Promise<void> {
    await this.resolve(target).scrollIntoViewIfNeeded();
  }

  async scrollBy(dx: number, dy: number): Promise<void> {
    await this.page.mouse.wheel(dx, dy);
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollTo(x: number, y: number): Promise<void> {
    await this.page.evaluate(({ x, y }) => window.scrollTo(x, y), { x, y });
  }

  async scrollWithinElement(container: string | Locator, dx: number, dy: number): Promise<void> {
    await this.resolve(container).evaluate(
      (el, { dx, dy }) => el.scrollBy(dx, dy),
      { dx, dy },
    );
  }

  async scrollToElementInContainer(container: string | Locator, target: string | Locator): Promise<void> {
    await this.resolve(target).scrollIntoViewIfNeeded();
    const handle = await this.resolve(container).elementHandle();
    const inner = await this.resolve(target).elementHandle();
    if (handle && inner) {
      await handle.evaluate((c, t) => {
        const top = (t as HTMLElement).offsetTop;
        (c as HTMLElement).scrollTop = top;
      }, inner);
    }
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async pressKeys(...keys: string[]): Promise<void> {
    for (const k of keys) await this.page.keyboard.press(k);
  }

  async pressKeyCombo(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    const mods = keys.slice(0, -1);
    const last = keys[keys.length - 1]!;
    for (const m of mods) await this.page.keyboard.down(m);
    await this.page.keyboard.press(last);
    for (let i = mods.length - 1; i >= 0; i--) await this.page.keyboard.up(mods[i]!);
  }

  async withModifier<T>(mod: 'Alt' | 'Control' | 'Meta' | 'Shift', fn: () => Promise<T>): Promise<T> {
    await this.page.keyboard.down(mod);
    try {
      return await fn();
    } finally {
      await this.page.keyboard.up(mod);
    }
  }

  async tab(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) await this.page.keyboard.press('Tab');
  }

  async uploadFile(target: string | Locator, filePath: string | string[]): Promise<void> {
    await this.resolve(target).setInputFiles(filePath);
  }

  async uploadFiles(target: string | Locator, paths: string[]): Promise<void> {
    await this.resolve(target).setInputFiles(paths);
  }

  async clearFileInput(target: string | Locator): Promise<void> {
    await this.resolve(target).setInputFiles([]);
  }

  async copyToClipboard(text: string): Promise<void> {
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await this.page.evaluate((t) => navigator.clipboard.writeText(t), text);
  }

  async readClipboard(): Promise<string> {
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    return await this.page.evaluate(() => navigator.clipboard.readText());
  }

  async paste(): Promise<void> {
    await this.page.keyboard.press(process.platform === 'darwin' ? 'Meta+V' : 'Control+V');
  }

  async focus(target: string | Locator): Promise<void> {
    await this.resolve(target).focus();
  }

  async blur(target: string | Locator): Promise<void> {
    await this.resolve(target).evaluate((el: HTMLElement) => el.blur());
  }

  async jsClick(target: string | Locator): Promise<void> {
    await this.resolve(target).evaluate((el: HTMLElement) => el.click());
  }

  async triggerEvent(target: string | Locator, type: string, data?: Record<string, unknown>): Promise<void> {
    await this.resolve(target).evaluate(
      (el, payload) => {
        const node = el as HTMLElement;
        node.dispatchEvent(new CustomEvent(payload.type, { detail: payload.data }));
      },
      { type, data },
    );
  }

  async setValueViaJs(target: string | Locator, value: string): Promise<void> {
    await this.resolve(target).evaluate((el: HTMLInputElement, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }

  private resolve(target: string | Locator): Locator {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }
}
