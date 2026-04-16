import { setDefaultTimeout } from '@cucumber/cucumber';
import { envInt } from '../../src/helpers/utils';

setDefaultTimeout(envInt('PWCRAFT_TIMEOUT', 60_000));
