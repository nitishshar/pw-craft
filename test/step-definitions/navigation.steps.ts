import { expect } from '@playwright/test';
import type { PwCraftSession } from '../../src/bdd/pw-session';
import { Then, When } from '../bdd/fixtures';

Then('I should see the home hero title', async function (this: PwCraftSession) {
  await this.assert.textContains(this.find.byTestId('home-hero-title'), /pw-craft/i);
});

Then('I should see the products heading', async function (this: PwCraftSession) {
  await this.assert.textEquals(this.page.getByRole('heading', { name: 'Products' }), 'Products');
});

Then('I should see the about heading', async function (this: PwCraftSession) {
  await this.assert.textEquals(this.page.getByRole('heading', { name: 'About Us' }), 'About Us');
});

When('I go back in browser history', async function (this: PwCraftSession) {
  await this.nav.goBack();
  await this.page.waitForURL(/\/products(\?|$)/, { timeout: 30_000 });
});

When('I go forward in browser history', async function (this: PwCraftSession) {
  await this.nav.goForward();
  await this.page.waitForURL(/\/about(\?|$)/, { timeout: 30_000 });
});

Then('I should be on the products route', async function (this: PwCraftSession) {
  expect(this.nav.getPath()).toContain('/products');
});

Then('I should be on the about route', async function (this: PwCraftSession) {
  expect(this.nav.getPath()).toContain('/about');
});

When(
  'I open products with query params category {string} and sort {string}',
  async function (this: PwCraftSession, category: string, sort: string) {
    await this.nav.goto('/products', { query: { category, sort } });
  },
);

Then('the products query param {string} should equal {string}', async function (this: PwCraftSession, key: string, value: string) {
  expect(this.nav.getQueryParam(key)).toBe(value);
});

When('I open the counter demo in a new tab', async function (this: PwCraftSession) {
  await this.nav.openInNewTab('/counter-demo');
});

Then('I should have at least {int} browser tabs', async function (this: PwCraftSession, min: number) {
  expect(this.nav.getAllPages().length).toBeGreaterThanOrEqual(min);
});

Then('I should see navigation link {string}', async function (this: PwCraftSession, name: string) {
  const toolbar = this.page.locator('mat-toolbar.app-toolbar');
  await this.assert.elementVisible(toolbar.getByRole('link', { name, exact: true }));
});
