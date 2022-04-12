import path from 'path';
import { $ } from 'zx';

// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll } from '@jest/globals';

$.verbose = true;
process.env.IS_TEST = 'true';

const testDataDir = path.resolve('tests', './test-data/');

beforeAll(() => {
  process.chdir(testDataDir);
});
