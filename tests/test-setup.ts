import { $ } from 'zx';
import path from 'path';

$.verbose = false;
process.env.IS_TEST = 'true';
export const testDataDir = path.resolve('tests', './test-data/');
