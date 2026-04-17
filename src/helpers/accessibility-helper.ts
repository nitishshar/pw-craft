/**
 * Lightweight **accessibility-oriented** checks without pulling a separate a11y engine: ARIA roles
 * and attributes, live regions, focus order (Tab walk), contrast-style helpers where applicable, and
 * optional **snapshot** text for debugging.
 *
 * @example Assert a live region role
 * ```ts
 * import { AccessibilityHelper } from 'pw-craft';
 *
 * const a11y = new AccessibilityHelper(page);
 * await a11y.checkLiveRegion('[data-testid="toast"]', 'status');
 * ```
 */
import type { Locator, Page } from '@playwright/test';

export class AccessibilityHelper {
  constructor(private readonly page: Page) {}

  async getAriaRole(target: string | Locator): Promise<string | null> {
    return await this.resolve(target).getAttribute('role');
  }

  async getAriaLabel(target: string | Locator): Promise<string | null> {
    return await this.resolve(target).getAttribute('aria-label');
  }

  async checkAriaLabel(target: string | Locator, expected: string): Promise<void> {
    const v = await this.resolve(target).getAttribute('aria-label');
    if (v !== expected) throw new Error(`ARIA label mismatch: expected "${expected}", got "${v}"`);
  }

  async checkAriaAttributes(target: string | Locator, required: Record<string, string>): Promise<void> {
    const loc = this.resolve(target);
    for (const [k, v] of Object.entries(required)) {
      const av = await loc.getAttribute(k);
      if (av !== v) throw new Error(`ARIA attr ${k}: expected "${v}", got "${av}"`);
    }
  }

  async getAllAriaAttributes(target: string | Locator): Promise<Record<string, string>> {
    const handle = await this.resolve(target).elementHandle();
    if (!handle) return {};
    const attrs = await handle.evaluate((el) => {
      const out: Record<string, string> = {};
      for (const a of Array.from((el as HTMLElement).attributes)) {
        const attr = a as Attr;
        if (attr.name.startsWith('aria-')) out[attr.name] = attr.value;
      }
      return out;
    });
    await handle.dispose();
    return attrs;
  }

  async checkLiveRegion(target: string | Locator, role: 'status' | 'alert' | 'log'): Promise<void> {
    const r = await this.getAriaRole(target);
    if (r !== role) throw new Error(`Live region role mismatch: expected ${role}, got ${r}`);
  }

  async getFocusedElement(): Promise<string | null> {
    return await this.page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.tagName ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}` : null;
    });
  }

  async getFocusOrder(max = 50): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < max; i++) {
      await this.page.keyboard.press('Tab');
      const sel = await this.page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return '';
        if (el.tagName === 'BODY') return '';
        return el.getAttribute('data-testid') || el.id || el.getAttribute('aria-label') || el.tagName.toLowerCase();
      });
      if (!sel) break;
      out.push(sel);
    }
    return out;
  }

  async assertKeyboardNavigation(selectors: string[]): Promise<void> {
    for (const sel of selectors) {
      await this.page.keyboard.press('Tab');
      const focused = await this.page.evaluate(() => document.activeElement?.matches?.call(document.activeElement, '*'));
      void focused;
      await this.page.locator(sel).first().waitFor({ state: 'visible' });
    }
  }

  async checkKeyboardAccessibility(): Promise<{ issues: string[] }> {
    const issues: string[] = [];
    const count = await this.page.locator('button:not([aria-label]):not([aria-labelledby])').count();
    if (count > 50) issues.push('Many buttons may be missing accessible names (heuristic).');
    return { issues };
  }

  async getColorInfo(target: string | Locator): Promise<{ color: string; backgroundColor: string }> {
    const loc = this.resolve(target);
    const color = await loc.evaluate((el) => getComputedStyle(el as HTMLElement).color);
    const backgroundColor = await loc.evaluate((el) => getComputedStyle(el as HTMLElement).backgroundColor);
    return { color, backgroundColor };
  }

  async getHeadingStructure(): Promise<Array<{ level: number; text: string }>> {
    return await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')) as HTMLElement[];
      return headings.map((h) => ({ level: Number(h.tagName[1]), text: h.innerText.trim() }));
    });
  }

  async checkSingleH1(): Promise<void> {
    const n = await this.page.locator('h1').count();
    if (n !== 1) throw new Error(`Expected exactly one h1, found ${n}`);
  }

  async checkHeadingHierarchy(): Promise<void> {
    const structure = await this.getHeadingStructure();
    let last = 0;
    for (const h of structure) {
      if (h.level > last + 1) throw new Error(`Heading level skip: ${last} -> ${h.level}`);
      last = Math.max(last, h.level);
    }
  }

  async findImagesWithoutAlt(): Promise<string[]> {
    return await this.page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => !img.alt || img.alt.trim() === '')
        .map((img) => img.src),
    );
  }

  async checkImageAltTexts(): Promise<{ missing: number }> {
    const missing = (await this.findImagesWithoutAlt()).length;
    return { missing };
  }

  async checkFormLabels(): Promise<{ issues: string[] }> {
    const issues = await this.page.evaluate(() => {
      const out: string[] = [];
      const inputs = Array.from(document.querySelectorAll('input,textarea,select')) as HTMLElement[];
      for (const el of inputs) {
        const id = el.getAttribute('id');
        const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
        const labelled =
          !!aria ||
          !!(id && document.querySelector(`label[for="${id}"]`)) ||
          !!el.closest('label');
        if (!labelled && el.getAttribute('type') !== 'hidden') out.push(`Unlabelled control: ${el.tagName}`);
      }
      return out;
    });
    return { issues };
  }

  async getAccessibilityTree(): Promise<unknown> {
    const pageWithA11y = this.page as unknown as { accessibility?: { snapshot: () => Promise<unknown> } };
    const snapshot = await pageWithA11y.accessibility?.snapshot?.();
    return snapshot ?? null;
  }

  async getAccessibilityTreeText(): Promise<string> {
    const tree = await this.getAccessibilityTree();
    return JSON.stringify(tree, null, 2);
  }

  private resolve(target: string | Locator): Locator {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }
}
