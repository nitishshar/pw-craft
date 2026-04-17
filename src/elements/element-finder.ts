/**
 * Thin, consistent wrappers around Playwright locators: **roles**, **test ids**, common **data-***
 * attributes, CSS/XPath, and Angular-ish selectors (`formcontrolname`, component tags). Pass an
 * optional second constructor argument (**root** `Locator`) to scope all lookups to a subtree
 * (dialog, card, row).
 *
 * @example Stable selectors for a demo app
 * ```ts
 * import { ElementFinder } from 'pw-craft';
 *
 * const find = new ElementFinder(page);
 * const title = find.byTestId('home-hero-title');
 * const submit = find.byRole('button', { name: /submit/i });
 * ```
 */
import type { Page, Locator } from '@playwright/test';

type Root = Page | Locator;

function rootOf(page: Page, root?: Locator): Root {
  return root ?? page;
}

export class ElementFinder {
  constructor(
    private readonly page: Page,
    private readonly root?: Locator,
  ) {}

  private r(): Root {
    return rootOf(this.page, this.root);
  }

  byRole(...args: Parameters<Page['getByRole']>): Locator {
    return this.r().getByRole(...args);
  }

  byLabel(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.r().getByLabel(text, options);
  }

  byPlaceholder(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.r().getByPlaceholder(text, options);
  }

  byText(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.r().getByText(text, options);
  }

  byAltText(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.r().getByAltText(text, options);
  }

  byTitle(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.r().getByTitle(text, options);
  }

  byTestId(testId: string | RegExp): Locator {
    return this.r().getByTestId(testId);
  }

  byCy(value: string): Locator {
    return this.r().locator(`[data-cy="${cssEscape(value)}"]`);
  }

  byQa(value: string): Locator {
    return this.r().locator(`[data-qa="${cssEscape(value)}"]`);
  }

  byDataAttr(name: string, value: string): Locator {
    return this.r().locator(`[data-${name}="${cssEscape(value)}"]`);
  }

  byCSS(selector: string): Locator {
    return this.r().locator(selector);
  }

  byXPath(xpath: string): Locator {
    return this.r().locator(`xpath=${xpath}`);
  }

  byId(id: string): Locator {
    return this.r().locator(`#${cssEscapeId(id)}`);
  }

  byName(name: string): Locator {
    return this.r().locator(`[name="${cssEscape(name)}"]`);
  }

  byClass(className: string): Locator {
    return this.r().locator(`.${cssEscapeClass(className)}`);
  }

  byHref(path: string): Locator {
    return this.r().locator(`a[href="${cssEscape(path)}"]`);
  }

  byType(type: string): Locator {
    return this.r().locator(`[type="${cssEscape(type)}"]`);
  }

  byValue(value: string): Locator {
    return this.r().locator(`[value="${cssEscape(value)}"]`);
  }

  byComponent(tag: string): Locator {
    return this.r().locator(tag);
  }

  byDirective(attr: string): Locator {
    return this.r().locator(`[${attr}]`);
  }

  byFormControl(name: string): Locator {
    return this.r().locator(`[formcontrolname="${cssEscape(name)}"]`);
  }

  byRouterLink(path: string): Locator {
    return this.r().locator(`a[routerLink="${cssEscape(path)}"]`);
  }

  withChild(parent: Locator | string, child: string): Locator {
    const p = typeof parent === 'string' ? this.r().locator(parent) : parent;
    return p.locator(child);
  }

  withText(locator: Locator | string, text: string | RegExp): Locator {
    const p = typeof locator === 'string' ? this.r().locator(locator) : locator;
    return p.filter({ hasText: text });
  }

  nth(locator: Locator | string, index: number): Locator {
    const p = typeof locator === 'string' ? this.r().locator(locator) : locator;
    return p.nth(index);
  }

  first(locator: Locator | string): Locator {
    const p = typeof locator === 'string' ? this.r().locator(locator) : locator;
    return p.first();
  }

  last(locator: Locator | string): Locator {
    const p = typeof locator === 'string' ? this.r().locator(locator) : locator;
    return p.last();
  }

  inFrame(frameSelector: string): ElementFinder {
    const frame = this.page.frameLocator(frameSelector);
    return new ElementFinder(this.page, frame.locator('body'));
  }

  inIframe(nameOrUrl: string | RegExp): ElementFinder {
    const sel =
      typeof nameOrUrl === 'string'
        ? `iframe[name="${cssEscape(nameOrUrl)}"]`
        : 'iframe';
    const frame = this.page.frameLocator(sel);
    return new ElementFinder(this.page, frame.locator('body'));
  }

  inShadowRoot(hostSelector: string): ElementFinder {
    const host = this.r().locator(hostSelector);
    return new ElementFinder(this.page, host);
  }

  tableRow(tableSelector: string, row: number): Locator {
    return this.r().locator(`${tableSelector} tbody tr`).nth(row);
  }

  tableCell(tableSelector: string, row: number, col: number): Locator {
    return this.tableRow(tableSelector, row).locator('td,th').nth(col);
  }

  tableRows(tableSelector: string): Locator {
    return this.r().locator(`${tableSelector} tbody tr`);
  }

  tableHeader(tableSelector: string, col: number): Locator {
    return this.r().locator(`${tableSelector} thead th`).nth(col);
  }

  listItem(listSelector: string, n: number): Locator {
    return this.r().locator(`${listSelector} li`).nth(n);
  }

  listItems(listSelector: string): Locator {
    return this.r().locator(`${listSelector} li`);
  }

  checkboxByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label).locator('input[type="checkbox"]');
  }

  radioByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label).locator('input[type="radio"]');
  }

  selectByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label).locator('select, mat-select');
  }

  submitButton(): Locator {
    return this.r().locator('button[type="submit"], input[type="submit"]');
  }

  allButtons(): Locator {
    return this.r().locator('button');
  }

  allInputs(): Locator {
    return this.r().locator('input, textarea, select');
  }

  allLinks(): Locator {
    return this.r().locator('a[href]');
  }
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function cssEscapeId(id: string): string {
  return id.replace(/([ !"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
}

function cssEscapeClass(c: string): string {
  return c.replace(/([ !"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1');
}
