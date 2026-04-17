import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { createBdd, test as bddBase } from 'playwright-bdd';
import { PwCraftSession } from '../../src/bdd/pw-session';
import { loadPwCraftConfigFromEnv } from '../../src/config-from-env';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const test = bddBase.extend<{ world: PwCraftSession }>({
  world: async ({ page, context, browser }, use, testInfo) => {
    const cfg = loadPwCraftConfigFromEnv();
    const world = new PwCraftSession(testInfo, cfg, page, context, browser);
    await world.ready();
    await use(world);
    const passed = testInfo.status === 'passed';
    await world.teardown(passed);
  },
});

const { Given, When, Then, BeforeStep, AfterStep } = createBdd(test, { worldFixture: 'world' });
export { Given, When, Then, test };

BeforeStep(async ({ world, $step }) => {
  world.logger.info(`Step: ${$step.text ?? ''}`);
});

AfterStep(async ({ world, $step }) => {
  world.logger.info(`Step finished: ${$step.text ?? ''}`);
  const { stepScreenshot, stepScreenshotFullPage } = world.pwCraftConfig.gherkin.attachments;
  if (stepScreenshot) {
    try {
      const buf = await world.page.screenshot({ fullPage: stepScreenshotFullPage });
      if (buf) {
        const label = ($step.text ?? 'step').replace(/[^\w.-]+/g, '_').slice(0, 80);
        await world.attach(buf, 'image/png', `step-${label}`);
      }
    } catch {
      // ignore (page may be unavailable in edge cases)
    }
  }
});
