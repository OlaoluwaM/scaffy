import faker from '@faker-js/faker/locale/en';

// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect, describe } from '@jest/globals';
import { pickObjPropsToAnotherObj, valueIs } from '../src/utils';
import {
  Or,
  ArrayValidator,
  ObjectValidator,
  StringValidator,
  NumberValidator,
  InterfaceToValidatorSchema,
} from '../src/lib/schema-validator/index';

describe('Tests for schema validation library', () => {
  test('success when object matches schema', () => {
    // Arrange
    type SampleObject = {
      a: string;
      c: string;
      b: string[];
    };

    const sampleObject: SampleObject = {
      a: faker.datatype.string(4),
      c: faker.datatype.string(4),
      b: faker.datatype.array().filter(valueIs.aString),
    };

    const schema: InterfaceToValidatorSchema<SampleObject> = {
      a: StringValidator(),
      c: StringValidator(),
      b: ArrayValidator(StringValidator()),
    };

    // Act
    const validationResult = ObjectValidator<SampleObject>(schema)({
      value: sampleObject,
      path: ['sample object'],
    });

    // Assert
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors.length).toEqual(0);
  });

  test('error when object does not match schema', () => {
    // Arrange
    interface SampleObject {
      c: string[];
      b: string[];
      d: 'ii';
    }

    const sampleObject: SampleObject = {
      c: faker.datatype.array().filter(valueIs.aString),
      b: faker.datatype.array().filter(valueIs.aString),
      d: 'ii',
    };

    const schema = {
      a: StringValidator(),
      c: StringValidator(),
      b: StringValidator(),
      d: StringValidator({ options: ['and', 'let', 'or'] as const }),
    };

    // Act
    const validationResult = ObjectValidator(schema)({
      value: sampleObject as any,
      path: ['sample object'],
    });

    // Assert
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors.length).toBeGreaterThanOrEqual(1);
  });

  test('That validation exits immediately on reference type mismatch', () => {
    // Act
    const { errors: arrayMismatchErrors } = ArrayValidator(StringValidator())({
      value: faker.datatype.number() as any,
      path: ['initial array'],
    });

    const { errors: objectMismatchErrors } = ObjectValidator({
      foo: StringValidator(),
    })({ value: faker.datatype.array() as any, path: ['initial object'] });

    // Assert
    expect([arrayMismatchErrors.length, objectMismatchErrors.length]).toEqual([1, 1]);
  });

  test('That schema violations can be excluded from object', () => {
    // Arrange
    const sampleObject = {
      a: faker.datatype.string(4),
      c: faker.datatype.number(4),
      b: faker.datatype.array().filter(valueIs.aNumber),
      e: faker.datatype.array().filter(valueIs.aString),
      f: faker.datatype.number(10),
    };

    const desiredOutputObj = pickObjPropsToAnotherObj(sampleObject, ['a', 'e']);

    const schema = {
      a: StringValidator(),
      c: StringValidator(),
      b: ArrayValidator(StringValidator()),
      e: ArrayValidator(StringValidator()),
      f: ArrayValidator(NumberValidator()),
    };

    // Act
    const validationResult = ObjectValidator(schema, { filterViolations: true })({
      value: sampleObject as any,
      path: ['sample object'],
    });

    // Assert
    expect(validationResult.value).toEqual(desiredOutputObj);
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors.length).toEqual(0);
  });

  test('That nothing is excluded if there are no schema violations', () => {
    // Arrange
    const sampleObject = {
      a: faker.datatype.string(4),
      c: faker.datatype.number(4),
      b: faker.datatype.array().filter(valueIs.aNumber),
      e: faker.datatype.array().filter(valueIs.aString),
      f: faker.datatype.boolean() ? 0 : faker.datatype.number(10),
    };

    const schema: InterfaceToValidatorSchema<typeof sampleObject> = {
      a: StringValidator(),
      c: NumberValidator(),
      b: ArrayValidator(NumberValidator()),
      e: ArrayValidator(StringValidator()),
      f: NumberValidator(),
    };

    // Act
    const validationResult = ObjectValidator(schema, { filterViolations: true })({
      value: sampleObject,
      path: ['sample object'],
    });

    // Assert
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors.length).toEqual(0);
    expect(validationResult.value).toEqual(sampleObject);
  });

  test.each([[true], [false]])(
    'That object is returned as is if it contains some members of the schema with correct types',
    filterViolations => {
      // Arrange
      const sampleObject = {
        a: faker.datatype.string(4),
        c: faker.datatype.number(4),
      };

      const schema = {
        a: StringValidator(),
        c: NumberValidator(),
        b: ArrayValidator(NumberValidator()),
        e: ArrayValidator(StringValidator()),
        f: NumberValidator(),
      };

      // Act
      const validationResult = ObjectValidator(schema, { filterViolations })({
        value: sampleObject as any,
        path: ['sample object'],
      });

      // Assert
      expect(validationResult.value).toEqual(sampleObject);
    }
  );

  test('That objects with only invalid properties are considered as schema violations', () => {
    // Arrange
    const sampleObject = {
      e: faker.datatype.string(4),
      g: faker.datatype.number(4),
      j: faker.datatype.array(),
    };

    const schema = {
      a: StringValidator(),
      c: NumberValidator(),
      b: ArrayValidator(NumberValidator()),
      n: ArrayValidator(StringValidator()),
      f: NumberValidator(),
    };

    // Act
    const validationResult = ObjectValidator(schema)({
      value: sampleObject as any,
      path: ['sample object'],
    });

    // Assert
    expect(validationResult.errors.length).toBe(Object.keys(schema).length);
    expect(validationResult.isValid).toBe(false);
  });

  describe('Tests for Schema predicates', () => {
    test('Should ensure predicates work as expected given a happy path scenario', () => {
      // Arrange
      type SampleObject = {
        a: string;
        l: 'and' | 'or';
        c: string;
        e: string[] | number[];
        b: string[];
        d: string | number;
        f:
          | string
          | {
              from: string;
              merge: string;
            };
      };

      const sampleObject: SampleObject = {
        a: faker.datatype.string(4),
        c: faker.datatype.string(4),
        l: faker.helpers.arrayElement(['and', 'or']),
        b: faker.datatype.array().filter(valueIs.aString),
        d: faker.helpers.arrayElement([1, 2, 'dadss', 'dddd', 'ddd', 4, 2]),
        e: faker.helpers.arrayElement([
          [1, 2, 3, 4, 5],
          ['a', 'f', 'g', 't'],
        ]),
        f: faker.helpers.arrayElement([
          'aa',
          'ff',
          'ce',
          'we',
          'sd',
          { from: 'ss', merge: 'ss' },
        ]),
      };

      const schema: InterfaceToValidatorSchema<SampleObject> = {
        a: StringValidator(),
        c: StringValidator(),
        l: StringValidator({ options: ['and', 'or'] as const }),
        e: Or(ArrayValidator(StringValidator()), ArrayValidator(NumberValidator())),
        b: ArrayValidator(StringValidator()),
        d: Or(StringValidator(), NumberValidator()),
        f: Or(
          StringValidator(),
          ObjectValidator({
            from: StringValidator(),
            merge: StringValidator(),
          })
        ),
      };

      // Act
      const validationResult = ObjectValidator<SampleObject>(schema)({
        value: sampleObject,
        path: ['sample object'],
      });

      // Assert
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors.length).toEqual(0);
    });

    test('Should ensure errors are handled gracefully with predicates', () => {
      // Arrange
      const sampleObject = {
        a: faker.datatype.string(4),
        c: faker.datatype.number(4),
        i: faker.datatype.boolean(),
      };
      const NUM_OF_PREDICATE_VALIDATIONS = 2;

      const schema = {
        a: StringValidator(),
        c: NumberValidator(),
        i: Or(NumberValidator(), ArrayValidator(StringValidator())),
      };

      // Act
      const validationResult = ObjectValidator(schema)({
        value: sampleObject as any,
        path: ['sample object'],
      });

      // Assert
      expect(validationResult.errors.length).toBe(NUM_OF_PREDICATE_VALIDATIONS);
      expect(validationResult.isValid).toBe(false);
    });
  });
});
