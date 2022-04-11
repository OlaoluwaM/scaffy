import { $ } from 'zx';
import path from 'path';

$.verbose = true;
process.env.IS_TEST = 'true';
export const testDataDir = path.resolve('tests', './test-data/');
