import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class AssertHelper {
  constructor(private readonly page: Page) {}

  async elementVisible(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeVisible({ timeout });
  }

  async elementHidden(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeHidden({ timeout });
  }

  async elementPresent(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeAttached({ timeout });
  }

  async elementAbsent(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).not.toBeAttached({ timeout });
  }

  async elementEnabled(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeEnabled({ timeout });
  }

  async elementDisabled(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeDisabled({ timeout });
  }

  async elementChecked(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeChecked({ timeout });
  }

  async elementUnchecked(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).not.toBeChecked({ timeout });
  }

  async elementFocused(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeFocused({ timeout });
  }

  async elementEditable(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toBeEditable({ timeout });
  }

  async elementReadonly(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveJSProperty('readOnly', true, { timeout });
  }

  async textEquals(target: string | Locator, text: string, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveText(text, { timeout });
  }

  async textContains(target: string | Locator, text: string | RegExp, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toContainText(text, { timeout });
  }

  async textNotContains(target: string | Locator, text: string | RegExp, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).not.toContainText(text, { timeout });
  }

  async textMatchesRegex(target: string | Locator, pattern: RegExp, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveText(pattern, { timeout });
  }

  async pageTitle(expected: string | RegExp, timeout?: number): Promise<void> {
    await expect(this.page).toHaveTitle(expected, { timeout });
  }

  async inputValue(target: string | Locator, value: string | RegExp, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveValue(value, { timeout });
  }

  async inputValueContains(target: string | Locator, part: string, timeout?: number): Promise<void> {
    const v = await this.resolve(target).inputValue({ timeout });
    expect(v).toContain(part);
  }

  async inputEmpty(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveValue('', { timeout });
  }

  async selectHasOption(target: string | Locator, optionText: string, timeout?: number): Promise<void> {
    await expect(this.resolve(target).locator(`option:has-text("${optionText}")`)).toBeAttached({ timeout });
  }

  async hasAttribute(target: string | Locator, name: string, value?: string | RegExp, timeout?: number): Promise<void> {
    if (value === undefined) {
      const v = await this.resolve(target).getAttribute(name, { timeout });
      expect(v, `missing attribute ${name}`).not.toBeNull();
    } else await expect(this.resolve(target)).toHaveAttribute(name, value, { timeout });
  }

  async hasClass(target: string | Locator, className: string, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveClass(new RegExp(`(^|\\s)${escapeRe(className)}(\\s|$)`), { timeout });
  }

  async notHasClass(target: string | Locator, className: string, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).not.toHaveClass(new RegExp(`(^|\\s)${escapeRe(className)}(\\s|$)`), {
      timeout,
    });
  }

  async hasId(target: string | Locator, id: string, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveAttribute('id', id, { timeout });
  }

  async cssProperty(target: string | Locator, name: string, value: string | RegExp, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveCSS(name, value, { timeout });
  }

  async elementCount(target: string | Locator, count: number, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).toHaveCount(count, { timeout });
  }

  async elementCountGreaterThan(target: string | Locator, min: number, timeout?: number): Promise<void> {
    await expect(async () => {
      const n = await this.resolve(target).count();
      expect(n).toBeGreaterThan(min);
    }).toPass({ timeout });
  }

  async listNotEmpty(target: string | Locator, timeout?: number): Promise<void> {
    await expect(this.resolve(target)).not.toHaveCount(0, { timeout });
  }

  async urlEquals(expected: string, timeout?: number): Promise<void> {
    await expect(this.page).toHaveURL(expected, { timeout });
  }

  async urlContains(part: string, timeout?: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(escapeRe(part)), { timeout });
  }

  async urlMatches(pattern: RegExp, timeout?: number): Promise<void> {
    await expect(this.page).toHaveURL(pattern, { timeout });
  }

  async matchesSnapshot(locator: string | Locator, _name?: string): Promise<void> {
    await expect(this.resolve(locator)).toHaveScreenshot();
  }

  async pageMatchesSnapshot(_name?: string): Promise<void> {
    await expect(this.page).toHaveScreenshot({ fullPage: true });
  }

  async tableCellText(tableSelector: string, row: number, col: number, text: string | RegExp): Promise<void> {
    const cell = this.page.locator(`${tableSelector} tbody tr`).nth(row).locator('td,th').nth(col);
    await expect(cell).toHaveText(text);
  }

  async tableRowCount(tableSelector: string, count: number): Promise<void> {
    await expect(this.page.locator(`${tableSelector} tbody tr`)).toHaveCount(count);
  }

  softAssert(condition: boolean, message: string, errors: string[]): void {
    if (!condition) errors.push(message);
  }

  throwSoftAssertions(errors: string[]): void {
    if (errors.length) throw new Error(`Soft assertion failures:\n- ${errors.join('\n- ')}`);
  }

  async custom(condition: () => Promise<boolean> | boolean, message: string): Promise<void> {
    expect(await condition(), message).toBeTruthy();
  }

  private resolve(target: string | Locator): Locator {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
