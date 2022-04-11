// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect, describe } from '@jest/globals';
import {
  isSubset,
  rawTypeOf,
  isObjSubset,
  pickObjPropsToAnotherObj,
  extractSubsetFromCollection,
} from '../src/utils';

describe('Tests for asserting array and object subsets', () => {
  test.each([
    [true, [1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4]],
    [false, [1, 2, 3, 4, 5, 6, 7, 8], [11, 21, 12, 43]],
    [false, [1, 2, 3, 4, 5, 6, 7, 8], []],
    [true, [1, 2, 3, 4, 5, 6, 7, 8], [999, 323, 3123, 1, 4, 2, 12123]],
  ])(
    'Should check that we can determine if array B being a true subset of array A is %s with utility function',
    (expected, arrA, arrB) => {
      // Arrange
      // Act
      const arrAIsSubsetOfArrB = isSubset(arrA, arrB);

      // Assert
      expect(arrAIsSubsetOfArrB).toBe(expected);
    }
  );
  test.each([
    [true, { a: 1, b: 2, c: 4, d: 'aa' }, { g: 1, f: 2, c: 4 }],
    [true, { a: 1, b: 2, c: 4, d: 'aa' }, { a: 1, b: 2, c: 4, d: 'aa' }],
    [true, { a: 1, b: 2, c: 4, d: 'aa' }, { c: 4, d: 'aa' }],
    [true, { a: 1, b: 2, c: 4, d: 'aa' }, { h: 1, l: 2, c: 4, d: 'aa' }],
    [false, { a: 1, b: 2, c: 4, d: 'aa' }, { a: 'dd', b: 'rr', c: 'asda', d: 34 }],
    [false, { a: 1, b: 2, c: 4, d: 'aa' }, { c: [], d: 322 }],
    [false, { f: 4, l: 'o', k: 'adad', r: 33 }, { h: 1, ml: 2, c: 4, d: 'aa' }],
    [false, { f: 4, l: 'o', k: 'adad', r: 33 }, {}],
  ])(
    'Should check that we can determine if object B being a subset of object A is %s with utility function',
    (expected, arrA, arrB) => {
      // Arrange
      // Act
      const arrAIsSubsetOfArrB = isObjSubset(arrA, arrB);

      // Assert
      expect(arrAIsSubsetOfArrB).toBe(expected);
    }
  );
});

describe('Tests for handling subsets of arrays', () => {
  test.each([
    [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 5, 11], [1, 5], false],
    [[11, 44, 23, 433, 12, 433, 442], [1, 2, 3], [], false],
    [[11, 44, 23, 433, 12, 433, 4], [], [], false],
    [[1, 2, 3, 4, 5, 6, 7], [2, 3, 4], [1, 5, 6, 7], true],
    [[1, 2, 3, 4, 5, 6, 7], [55, 32, 43], [1, 2, 3, 4, 5, 6, 7], true],
    [[11, 44, 23, 433, 12, 433, 4], [], [11, 44, 23, 433, 12, 433, 4], true],
  ])(
    'Should check that we can extract and exclude subsets from arrays with utility function',
    (firstArg, secondArg, expectation, shouldExclude) => {
      // Act
      const output = extractSubsetFromCollection(firstArg, secondArg, shouldExclude);

      // Assert
      expect(output).toEqual(expectation);
    }
  );
});

describe('Tests for retrieving the raw types of entities', () => {
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
});

describe('Tests for utility to extract properties to separate object', () => {
  test('Should ensure properties can be extracted to separate object', () => {
    // Arrange
    const initialObject = {
      a: 11,
      b: 'sss',
      c: [1, 2, 3, 4],
      d: ['dd', 23, 'dd'],
    };

    const desiredOutputObj = {
      a: initialObject.a,
      b: initialObject.b,
    };

    // Act
    const outputObj = pickObjPropsToAnotherObj(initialObject, ['a', 'b']);

    // Assert
    expect(outputObj).toEqual(desiredOutputObj);
  });

  test('Should ensure properties can be excluded from object', () => {
    // Arrange
    const initialObject = {
      a: 11,
      b: 'sss',
      c: [1, 2, 3, 4],
      d: ['dd', 23, 'dd'],
    };

    const desiredOutputObj = {
      c: initialObject.c,
      d: initialObject.d,
    };

    // Act
    const outputObj = pickObjPropsToAnotherObj(initialObject, ['a', 'b'], true);

    // Assert
    expect(outputObj).toEqual(desiredOutputObj);
  });
  test('Should ensure properties can be extracted to separate object even if there are duplicate props listed', () => {
    // Arrange
    const initialObject = {
      a: 11,
      b: 'sss',
      c: [1, 2, 3, 4],
      d: ['dd', 23, 'dd'],
    };

    const desiredOutputObj = {
      d: initialObject.d,
    };

    // Act
    const outputObj = pickObjPropsToAnotherObj(initialObject, [
      'd',
      'd',
      'd',
      'd',
      'd',
      'd',
      'd',
      'd',
    ]);

    // Assert
    expect(outputObj).toEqual(desiredOutputObj);
  });
});
