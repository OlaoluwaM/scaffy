/* global test, expect, describe */

import * as Utils from '../src/utils';

describe('Tests for array subset predicate', () => {
  test.each([
    [true, [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4]],
    [false, [1, 2, 3, 4, 5, 6, 7, 8], [11, 21, 12, 43]],
  ])(
    'Should check that we can determine if array B being a true subset of array A is %s',
    (expected, arrA, arrB) => {
      // Arrange
      // Act
      const isSubset = Utils.isSubset(arrA, arrB);

      // Assert
      expect(isSubset).toBe(expected);
    }
  );
});
