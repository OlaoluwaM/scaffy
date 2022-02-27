import { isSubset } from '../src/utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@jest/globals';

test.each([
  [true, [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4]],
  [false, [1, 2, 3, 4, 5, 6, 7, 8], [11, 21, 12, 43]],
])(
  'Should check that we can determine if array B being a true subset of array A is %s',
  (expected, arrA, arrB) => {
    // Arrange
    // Act
    const arrAIsSubsetOfArrB = isSubset(arrA, arrB);

    // Assert
    expect(arrAIsSubsetOfArrB).toBe(expected);
  }
);
