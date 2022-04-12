import path from 'path';

import { $ } from 'zx';
// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll } from '@jest/globals';
import { fileURLToPath } from 'url';

$.verbose = true;
process.env.IS_TEST = 'true';

// eslint-disable-next-line camelcase
const __test_filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line camelcase
const __test_dirname = path.dirname(__test_filename);

const testDataDir = path.join(__test_dirname, './test-data/');

beforeAll(() => {
  console.log({ testDataDir });
  process.chdir(testDataDir);
});
