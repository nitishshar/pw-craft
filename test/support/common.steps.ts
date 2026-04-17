import type { PwCraftSession } from '../../src/bdd/pw-session';
import { Given, When } from '../bdd/fixtures';

Given('I open the application', async function (this: PwCraftSession) {
  await this.nav.goto('/');
});

When('I navigate to the products page', async function (this: PwCraftSession) {
  await this.nav.goto('/products');
});

When('I navigate to the about page', async function (this: PwCraftSession) {
  await this.nav.goto('/about');
});

When('I navigate to the form demo page', async function (this: PwCraftSession) {
  await this.nav.goto('/form-demo');
});

When('I navigate to the async demo page', async function (this: PwCraftSession) {
  await this.nav.goto('/async-demo');
});

When('I navigate to the counter demo page', async function (this: PwCraftSession) {
  await this.nav.goto('/counter-demo');
});

When('I navigate to the animation demo page', async function (this: PwCraftSession) {
  await this.nav.goto('/animation-demo');
});

When('I navigate to the home page explicitly', async function (this: PwCraftSession) {
  await this.nav.goto('/');
});
