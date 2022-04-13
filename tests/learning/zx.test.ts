import { doesPathExist } from '../../src/app/helpers';
import { $, ProcessOutput } from 'zx';
// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect, beforeAll } from '@jest/globals';

beforeAll(() => {
  const LEARNING_TESTS_DATA_DIR = './for-learning';
  process.chdir(LEARNING_TESTS_DATA_DIR);
});

async function commandWithDynamicFlags(flags: string[] = []): Promise<ProcessOutput> {
  // Using `ls` here because it does not error out when called with no args or flags
  return $`ls ${flags} &> /dev/null`;
}

test.each([
  ['handles dynamic flags as expected', ['--version']],
  ['does not throw error if flags array is empty', []],
])('Should check that zx %s', async (str, flags) => {
  const processOutput = await commandWithDynamicFlags(flags);
  expect(processOutput.exitCode).toBe(0);
});

test('Should check how files are deleted in zx', async () => {
  // Act
  await $`touch ./example.txt`;
  await $`rm ./example.txt`;

  // Assert
  expect(await doesPathExist(`./example.txt`)).toBe(false);
});
