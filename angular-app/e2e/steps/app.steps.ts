import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PwCraftWorld } from '../../../src/cucumber/world';

When('I fill the full name with {string}', async function (this: PwCraftWorld, value: string) {
  await this.action.fill('[data-testid="full-name-input"]', value);
});

Then('the full name field should contain {string}', async function (this: PwCraftWorld, value: string) {
  await this.assert.inputValue('[data-testid="full-name-input"]', value);
});

When('I submit a valid demo form', async function (this: PwCraftWorld) {
  await this.action.fill('[data-testid="full-name-input"]', 'Test User');
  await this.action.fill('[data-testid="email-input"]', 'test@example.com');
  await this.action.click('[data-testid="category-select"]');
  await this.page.getByRole('option', { name: 'Support' }).click();
  await this.page.getByRole('checkbox', { name: 'I accept the terms' }).check();
  await this.action.click('[data-testid="submit-form"]');
});

Then('I should see the form success toast', async function (this: PwCraftWorld) {
  await this.assert.elementVisible('[data-testid="success-toast"]');
});

When('I select category {string}', async function (this: PwCraftWorld, label: string) {
  await this.action.click('[data-testid="category-select"]');
  await this.page.getByRole('option', { name: label }).click();
});

Then('the category value should be {string}', async function (this: PwCraftWorld, value: string) {
  await this.assert.textEquals('[data-testid="category-value"]', value);
});

Then('I should see the data table', async function (this: PwCraftWorld) {
  await this.wait.forVisible('[data-testid="data-table"]', 30_000);
});

Then('I should see the async content', async function (this: PwCraftWorld) {
  await this.wait.forVisible('[data-testid="async-content"]', 30_000);
});

Then('I should see job status {string}', async function (this: PwCraftWorld, status: string) {
  await this.wait.forText('[data-testid="job-status"]', status, 30_000);
});

Then('the counter display should not be {string}', async function (this: PwCraftWorld, value: string) {
  await this.wait.until(async () => (await this.page.locator('[data-testid="counter-display"]').innerText()).trim() !== value, {
    timeout: 30_000,
  });
});

Then('the counter display should be {string}', async function (this: PwCraftWorld, value: string) {
  await this.wait.until(async () => (await this.page.locator('[data-testid="counter-display"]').innerText()).trim() === value, {
    timeout: 30_000,
  });
});

Then('the animated element should include class {string}', async function (this: PwCraftWorld, className: string) {
  await this.wait.forClass('[data-testid="animated-element"]', className, 30_000);
});

Then('the fade element should have fade-out styling', async function (this: PwCraftWorld) {
  await this.wait.forClass('[data-testid="fade-element"]', 'fade-out', 30_000);
});

Then('there should be exactly one h1', async function (this: PwCraftWorld) {
  await this.assert.elementCount('h1', 1);
});
