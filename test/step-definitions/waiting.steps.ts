import { expect } from '@playwright/test';
import type { PwCraftSession } from '../../src/bdd/pw-session';
import { Then, When } from '../bdd/fixtures';

When('I click the load table button', async function (this: PwCraftSession) {
  await this.action.click(this.find.byTestId('load-table'));
});

Then('the data table should become visible', async function (this: PwCraftSession) {
  await this.wait.forVisible(this.find.byTestId('data-table'), 30_000);
});

Then('the loading spinner should disappear', async function (this: PwCraftSession) {
  await this.wait.forAngularSpinnerGone('[data-testid="loading-spinner"]', 30_000);
});

Then('I should see at least one product card', async function (this: PwCraftSession) {
  await this.wait.forCountAtLeast(this.find.byTestId('product-card'), 1, 30_000);
});

When('I click the slow API button', async function (this: PwCraftSession) {
  await this.action.click(this.find.byTestId('slow-api'));
});

Then('the async content should appear', async function (this: PwCraftSession) {
  await this.wait.forVisible(this.find.byTestId('async-content'), 30_000);
});

When('I click increment until the counter is greater than 0', async function (this: PwCraftSession) {
  await this.wait.until(async () => {
    const text = await this.find.byTestId('counter-display').innerText();
    const n = Number.parseInt(text.trim(), 10);
    if (Number.isFinite(n) && n > 0) return true;
    await this.action.click(this.find.byTestId('increment'));
    return false;
  }, { timeout: 30_000, interval: 100 });
});

Then('the counter display should show a value greater than 0', async function (this: PwCraftSession) {
  const text = await this.find.byTestId('counter-display').innerText();
  const n = Number.parseInt(text.trim(), 10);
  expect(n).toBeGreaterThan(0);
});

When('I trigger the move animation', async function (this: PwCraftSession) {
  await this.action.click(this.find.byTestId('trigger-move'));
});

Then('the animated element should have the completion class', async function (this: PwCraftSession) {
  await this.wait.forClass(this.find.byTestId('animated-element'), 'animation-complete', 30_000);
});

Then('Angular should be stable', async function (this: PwCraftSession) {
  await this.wait.forLoadState('networkidle').catch(async () => {
    await this.wait.forLoadState('load');
  });
  await this.assert.elementVisible(this.find.byTestId('home-hero-title'));
});

When('I start the background job', async function (this: PwCraftSession) {
  await this.action.click(this.find.byTestId('start-background-job'));
});

Then('the job status should become {string}', async function (this: PwCraftSession, status: string) {
  await this.wait.forText(this.find.byTestId('job-status'), status, 30_000);
});
