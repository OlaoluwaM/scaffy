/* global $, test, expect */

import { ProcessOutput } from 'zx';
import { toMultiLineString } from '../../src/utils';

async function outputMultiLineString(arr: string[]): Promise<ProcessOutput> {
  return $`echo ${arr}`;
}

test('Should check that zx function correctly outputs multiline string', async () => {
  const testArr = ['foo', 'bar', 'buzz'];
  const processOutput = await outputMultiLineString(testArr);
  expect(processOutput.stdout).toBe(toMultiLineString(testArr));
});
