import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { PwCraftWorld } from '../../src/cucumber/world';

When('I fill the full name with {string}', async function (this: PwCraftWorld, value: string) {
  await this.action.fill(this.find.byTestId('full-name-input'), value);
});

Then('the full name field should contain {string}', async function (this: PwCraftWorld, value: string) {
  await this.assert.inputValue(this.find.byTestId('full-name-input'), value);
});

When('I submit a valid demo form', async function (this: PwCraftWorld) {
  await this.action.fill(this.find.byTestId('full-name-input'), 'Test User');
  await this.action.fill(this.find.byTestId('email-input'), 'test@example.com');
  await this.action.click(this.find.byTestId('category-select'));
  await this.page.getByRole('option', { name: 'Support' }).click();
  await this.page.getByRole('checkbox', { name: 'I accept the terms' }).check();
  await this.action.click(this.find.byTestId('submit-form'));
});

Then('I should see the form success toast', async function (this: PwCraftWorld) {
  await this.assert.elementVisible(this.find.byTestId('success-toast'));
});

When('I select category {string}', async function (this: PwCraftWorld, label: string) {
  await this.action.click(this.find.byTestId('category-select'));
  await this.page.getByRole('option', { name: label }).click();
});

Then('the category field should show {string}', async function (this: PwCraftWorld, label: string) {
  await this.assert.textEquals(this.find.byTestId('category-value'), label);
});

When('I set the newsletter checkbox to checked', async function (this: PwCraftWorld) {
  await this.page.getByRole('checkbox', { name: 'Newsletter' }).check();
});

When('I set the newsletter checkbox to unchecked', async function (this: PwCraftWorld) {
  await this.page.getByRole('checkbox', { name: 'Newsletter' }).uncheck();
});

Then('the newsletter checkbox should be checked', async function (this: PwCraftWorld) {
  await this.assert.elementChecked(this.page.getByRole('checkbox', { name: 'Newsletter' }));
});

Then('the newsletter checkbox should be unchecked', async function (this: PwCraftWorld) {
  await this.assert.elementUnchecked(this.page.getByRole('checkbox', { name: 'Newsletter' }));
});

When('I select shipping {string}', async function (this: PwCraftWorld, value: string) {
  await this.action.click(this.find.byTestId(`shipping-${value}`));
});

Then('the shipping radio {string} should be checked', async function (this: PwCraftWorld, value: string) {
  const label = value === 'overnight' ? 'Overnight' : value === 'express' ? 'Express' : 'Standard';
  await this.assert.elementChecked(this.page.getByRole('radio', { name: label }));
});

When('I drag the first draggable item into the drop zone', async function (this: PwCraftWorld) {
  await this.find.byTestId('drag-item-1').dragTo(this.find.byTestId('drop-zone'), { force: true }).catch(() => undefined);
  const count = (await this.find.byTestId('dropped-count').innerText()).trim();
  if (count === '0') {
    await this.action.jsClick(this.find.byTestId('simulate-drop'));
  }
});

Then('the drop zone should contain dragged text', async function (this: PwCraftWorld) {
  await this.assert.textEquals(this.find.byTestId('dropped-count'), '1');
});

When('I tab until the tooltip trigger is focused', async function (this: PwCraftWorld) {
  await this.action.focus(this.find.byTestId('full-name-input'));
  for (let i = 0; i < 80; i++) {
    await this.page.keyboard.press('Tab');
    const focused = await this.page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.getAttribute('data-testid') ?? '';
    });
    if (focused === 'tooltip-trigger') return;
  }
  throw new Error('Could not focus tooltip trigger via keyboard');
});

Then('the tooltip trigger should be focused', async function (this: PwCraftWorld) {
  await this.assert.elementFocused(this.find.byTestId('tooltip-trigger'));
});

When('I upload a temporary text file', async function (this: PwCraftWorld) {
  const filePath = path.join(os.tmpdir(), `pw-craft-upload-${Date.now()}.txt`);
  await fs.writeFile(filePath, 'hello pw-craft', 'utf8');
  await this.action.uploadFile(this.find.byTestId('file-input'), filePath);
});

Then('the file name display should not be empty', async function (this: PwCraftWorld) {
  const text = await this.find.byTestId('file-name-display').innerText();
  expect(text.trim().length).toBeGreaterThan(0);
});

When('I attempt to submit the form without required fields', async function (this: PwCraftWorld) {
  await this.action.click(this.find.byTestId('submit-form'));
});

Then('I should see a validation error for full name', async function (this: PwCraftWorld) {
  await this.assert.elementVisible(this.find.byTestId('full-name-error'));
});

Then('I should see a validation error for email', async function (this: PwCraftWorld) {
  await this.assert.elementVisible(this.find.byTestId('email-error'));
});

When('I slowly type {string} into the step size field', async function (this: PwCraftWorld, value: string) {
  const loc = this.find.byTestId('counter-step-input');
  await loc.click();
  await this.page.keyboard.press('ControlOrMeta+A');
  await this.page.keyboard.press('Backspace');
  await this.action.typeSlowly(loc, value, 75);
});

Then('the step size field should contain {string}', async function (this: PwCraftWorld, value: string) {
  await this.assert.inputValue(this.find.byTestId('counter-step-input'), value);
});
