import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PwCraftWorld } from '../../../src/cucumber/world';

Given('I open the application', async function (this: PwCraftWorld) {
  await this.nav.goto('/');
});

When('I navigate to {string}', async function (this: PwCraftWorld, slug: string) {
  const path = `/${slug}`.replaceAll('//', '/');
  await this.nav.goto(path === '/' ? '/' : path);
});

Then('I should be on the {string} page', async function (this: PwCraftWorld, slug: string) {
  expect(this.nav.getPath()).toContain(`/${slug}`);
});

Then('I should see the heading {string}', async function (this: PwCraftWorld, text: string) {
  await this.assert.textEquals(this.page.getByRole('heading', { name: text, exact: true }), text);
});

When('I click the {string} button', async function (this: PwCraftWorld, key: string) {
  const k = key.trim().toLowerCase();
  const selectors: Record<string, string> = {
    'load-table': '[data-testid="load-table"]',
    'slow-api': '[data-testid="slow-api"]',
    'start-background-job': '[data-testid="start-background-job"]',
    increment: '[data-testid="increment"]',
    decrement: '[data-testid="decrement"]',
    reset: '[data-testid="reset"]',
    'trigger-move': '[data-testid="trigger-move"]',
    'toggle fade': 'button:has-text("Toggle fade")',
  };
  const sel = selectors[k];
  if (!sel) throw new Error(`Unknown button key: ${key}`);
  await this.action.click(sel);
});

Then('I should see navigation link {string}', async function (this: PwCraftWorld, name: string) {
  await this.assert.elementVisible(this.page.getByRole('link', { name }));
});
