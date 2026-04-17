/**
 * **pw-craft** bundles opinionated Playwright helpers: browser lifecycle, navigation, locating
 * elements, user actions, waits, assertions, network mocking, browser storage, lightweight a11y checks,
 * screenshots/trace/video helpers, custom **HTML / JSON / JUnit** reports, and {@link PwCraftSession}
 * for **Gherkin** steps run by [playwright-bdd](https://github.com/vitalets/playwright-bdd).
 *
 * **Typical usage:** construct {@link BrowserManager} with {@link PwCraftConfig} (or
 * {@link loadPwCraftConfigFromEnv}), call {@link BrowserManager.launch}, then compose
 * {@link Navigator}, {@link ElementFinder}, {@link ActionHelper}, {@link WaitHelper}, and
 * {@link AssertHelper} around the returned `Page`.
 *
 * @packageDocumentation
 * @module pw-craft
 *
 * @example Minimal standalone script
 * ```ts
 * import { BrowserManager, Navigator, ElementFinder, AssertHelper } from 'pw-craft';
 *
 * async function main() {
 *   const manager = new BrowserManager({ baseUrl: 'http://localhost:4200', headless: true });
 *   const page = await manager.launch();
 *   const nav = new Navigator(page, 'http://localhost:4200');
 *   const find = new ElementFinder(page);
 *   const assert = new AssertHelper(page);
 *   await nav.goto('/');
 *   await assert.textContains(find.byTestId('home-hero-title'), /pw-craft/i);
 *   await manager.close();
 * }
 * ```
 */
export * from './config';
export * from './helpers/logger';
export * from './helpers/utils';
export * from './core/browser-manager';
export * from './navigation/navigator';
export * from './elements/element-finder';
export * from './actions/action-helper';
export * from './waiting/wait-helper';
export * from './helpers/assert-helper';
export * from './helpers/network-helper';
export * from './helpers/storage-helper';
export * from './helpers/accessibility-helper';
export * from './helpers/base-page';
export * from './media/media-helper';
export * from './reporting/report-generator';
export * from './bdd/pw-session';
export * from './config-from-env';
