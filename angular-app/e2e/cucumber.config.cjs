process.env.TS_NODE_PROJECT = require('path').join(__dirname, 'tsconfig.json');

module.exports = {
  requireModule: ['ts-node/register'],
  require: [
    '../../src/cucumber/world.ts',
    '../../src/cucumber/hooks.ts',
    'e2e/support/00-init.ts',
    'e2e/steps/shared.steps.ts',
    'e2e/steps/app.steps.ts',
  ],
  paths: ['e2e/features/app.feature'],
  format: ['progress-bar', 'json:reports/e2e-report.json'],
  publishQuiet: true,
};
