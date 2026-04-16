import { After, AfterStep, Before, BeforeStep, Status } from '@cucumber/cucumber';
import { envBool } from '../helpers/utils';
import { PwCraftWorld } from './world';

Before({ timeout: 120_000 }, async function (this: PwCraftWorld, scenario) {
  await this.init(scenario.pickle.name);
});

After({ timeout: 120_000 }, async function (this: PwCraftWorld, scenario) {
  const passed = scenario.result?.status === Status.PASSED;
  try {
    const logs = this.media.getConsoleLogs().join('\n');
    if (logs) await this.attachText(logs, 'text/plain');
  } catch {
    // ignore attach failures
  }
  if (!passed) {
    try {
      const buf = await this.page?.screenshot({ fullPage: true });
      if (buf) await this.attach(buf, 'image/png');
    } catch {
      // ignore
    }
  }
  await this.teardown(passed);
});

BeforeStep(async function (this: PwCraftWorld, arg) {
  const text = (arg as { pickleStep?: { text?: string } }).pickleStep?.text ?? '';
  this.logger.info(`Step: ${text}`);
});

AfterStep(async function (this: PwCraftWorld, arg: { result?: { status?: string }; pickleStep?: { text?: string } }) {
  const status = arg.result?.status;
  this.logger.info(`Step status: ${String(status)}`);
  if (envBool('PWCRAFT_STEP_SCREENSHOTS', false)) {
    const text = arg.pickleStep?.text ?? 'step';
    await this.stepScreenshot(text).catch(() => undefined);
  }
});
