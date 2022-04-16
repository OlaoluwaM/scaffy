import path from 'path';

import { $ } from 'zx';
// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll } from '@jest/globals';
import { getAbsolutePathsForFile } from '../src/constants';

$.verbose = !!process.env.CI;
process.env.IS_TEST = 'true';

// eslint-disable-next-line camelcase
const { __dirname: __test_dirname } = getAbsolutePathsForFile(import.meta.url);
export const testDataDir = path.join(__test_dirname, './test-data/');

beforeAll(() => {
  process.chdir(testDataDir);
});
