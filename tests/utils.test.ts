// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@jest/globals';
import { isSubset, extractSubsetFromCollection, rawTypeOf } from '../src/app/utils';

test.each([
  [true, [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4]],
  [false, [1, 2, 3, 4, 5, 6, 7, 8], [11, 21, 12, 43]],
])(
  'Should check that we can determine if array B being a true subset of array A is %s with isSubset utility function',
  (expected, arrA, arrB) => {
    // Arrange
    // Act
    const arrAIsSubsetOfArrB = isSubset(arrA, arrB);

    // Assert
    expect(arrAIsSubsetOfArrB).toBe(expected);
  }
);

test.each([
  [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 5, 11], [1, 5], false],
  [[11, 44, 23, 433, 12, 433, 442], [1, 2, 3], [], false],
  [[11, 44, 23, 433, 12, 433, 4], [], [], false],
  [[1, 2, 3, 4, 5, 6, 7], [2, 3, 4], [1, 5, 6, 7], true],
  [[1, 2, 3, 4, 5, 6, 7], [55, 32, 43], [1, 2, 3, 4, 5, 6, 7], true],
  [[11, 44, 23, 433, 12, 433, 4], [], [11, 44, 23, 433, 12, 433, 4], true],
])(
  'Should check that we can extract and exclude subsets from collections with utility function',
  (firstArg, secondArg, expectation, shouldExclude) => {
    // Act
    const output = extractSubsetFromCollection(firstArg, secondArg, shouldExclude);

    // Assert
    expect(output).toEqual(expectation);
  }
);

test.each([
  ['ssss', 'string'],
  [() => {}, 'function'],
  [{}, 'object'],
  [[123, 43], 'array'],
  [null, 'null'],
  [undefined, 'undefined'],
])(
  'Should check that we can get the actual data type of entities',
  (value: unknown, expectedType: string) => {
    // Act
    const computedType = rawTypeOf(value);

    // Assert
    expect(computedType).toBe(expectedType);
  }
);
