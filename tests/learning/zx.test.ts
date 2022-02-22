/* global test, expect, $ */
import 'zx/globals';

import { ProcessOutput } from 'zx';

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
