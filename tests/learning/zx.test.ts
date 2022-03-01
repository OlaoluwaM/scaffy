/* global $ */
import 'zx/globals';

import path from 'path';

// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@jest/globals';
import { ProcessOutput } from 'zx';
import { doesPathExist } from '../../src/lib/helpers';

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
  // Arrange
  const testDir = path.resolve('tests', './test-data/for-learning/');

  // Act
  await $`touch ${testDir}/example.txt`;

  // Assert
  expect(await doesPathExist(`${testDir}/example.txt`)).toBe(true);

  // Act
  await $`rm -rf ${testDir}/*`;

  // Assert
  expect(await doesPathExist(`${testDir}/example.txt`)).toBe(false);
});
