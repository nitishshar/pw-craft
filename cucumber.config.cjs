process.env.TS_NODE_PROJECT = require('path').join(__dirname, 'tsconfig.cucumber.json');

module.exports = {
  requireModule: ['ts-node/register'],
  require: [
    'src/cucumber/world.ts',
    'src/cucumber/hooks.ts',
    'test/support/00-init.ts',
    'test/support/common.steps.ts',
    'test/step-definitions/navigation.steps.ts',
    'test/step-definitions/forms.steps.ts',
    'test/step-definitions/waiting.steps.ts',
  ],
  format: ['progress-bar', 'json:reports/cucumber-report.json'],
  paths: ['test/features/navigation.feature', 'test/features/forms.feature', 'test/features/waiting.feature'],
  publishQuiet: true,
};
