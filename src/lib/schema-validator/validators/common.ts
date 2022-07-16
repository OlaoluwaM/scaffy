import defaultValidatorOptionsFor, { ValidatorOptions } from './config';

import { isEmpty, valueIs } from '../utils';
import {
  UnionToIntersection,
  ValidationPath,
  ValidatorInput,
  ValidatorTypes,
  ValidationResult,
  ValidationResultError,
} from '../types';

interface ValidationData<ValueType = unknown> {
  value: ValidatorInput<ValueType>['value'];
  path: ValidationPath;
  errors: ValidationResultError[];
}

export function validatorTemplate<TypeToCheckFor>(
  specificValidatorFunc: (
    // Here is why
    // https://www.typescriptlang.org/play?ts=4.6.4#code/JYOwLgpgTgZghgYwgAgILIN4CgCQcBcyAzmFKAOYDcuARoSAK4C2N0WAvllqJLIigCFkEAB6QQAEyJpMuKIRoB7RQBsIcENRwx6zVlA5ce0eEmQBhYWIiTp6bDgiESZEOQDaAXS0rdLaF64ANYKymoahlhgAJ4ADigAYsrIALwyAD7IQpnmUXGCcFCpMgBkWchluVgA9NXISYrIADyEqHnx9QwgCE0ACgB8xQAUsYS9AJSpgy4U1O0oAJJEAMoMNDHxTas0ACr5ADTIq-FQe-GDadtnKKLiUkcMJ9fIAPzIpAwohPAqRBDzyB2ABYAIzFJbbDYQJoNQ4CQqDLDIZHI2oAPReXChgIAzAAOcErNZQpoCOEI5BIlHIdGYgE7HEATkJkPypMODUR1Jp1QxWPygKBACYWcS2fCoBzlFzqbT+R1gTjRes2Qkuj1ORz1aSETKUXL6UCgcqSWruqT+lrzRL+nrUby6RIIAgVIUUDB1WBgIoQMgABaKGBDGAgQhmnoCfrjZykChYJ0ut3ID3dL0+5OFIbRzrmzlcLABoPwKBZ8ZAA
    validationOptions: UnionToIntersection<ValidatorOptions>
  ) => ValidationResult<TypeToCheckFor>
) {
  return (
    vI: ValidatorInput<TypeToCheckFor>,
    expectedType: ValidatorTypes,
    passedValidationOptions?: ValidatorOptions
  ) => {
    const normalizedValidationOptions = {
      ...defaultValidatorOptionsFor[expectedType],
      ...(passedValidationOptions ?? {}),
    };

    const validationData = isNeitherEmptyOrAnInvalidType(
      vI,
      expectedType,
      normalizedValidationOptions
    );

    const { value, errors: emptinessOrTypeErrors } = validationData;
    if (!isEmpty.array(emptinessOrTypeErrors)) {
      return generateValidationResult(value, emptinessOrTypeErrors);
    }

    return specificValidatorFunc(
      normalizedValidationOptions as UnionToIntersection<ValidatorOptions>
    );
  };
}

function isNeitherEmptyOrAnInvalidType<TypeToCheckFor>(
  vI: ValidatorInput<TypeToCheckFor>,
  expectedType: ValidatorTypes,
  options = defaultValidatorOptionsFor.base
): ValidationData<TypeToCheckFor> {
  const validationData = bootstrapValidatorData<TypeToCheckFor>(vI);

  const { allowEmpty } = options;
  const { value, path } = validationData;

  const isValidType = valueIs[expectedType](value);
  if (!isValidType) {
    return {
      ...validationData,
      errors: [generateValidationErr(path, `is not ${expectedType}`)],
    };
  }

  const isEmptyEntity = isEmpty[expectedType](
    value as Exclude<typeof value, TypeToCheckFor>
  );
  if (isEmptyEntity && !allowEmpty) {
    return {
      ...validationData,
      errors: [generateValidationErr(path, `is an empty ${expectedType}`)],
    };
  }

  return validationData;
}

export function bootstrapValidatorData<ValueType>(
  vI: ValidatorInput<ValueType>
): ValidationData<ValueType> {
  const { path, value } = vI;
  const errors: ValidationResultError[] = [];

  return { path, value, errors };
}

export function generateValidationResult<T>(
  val: T,
  errors: ValidationResultError[]
): ValidationResult<T> {
  return {
    errors,
    value: val,
    isValid: isEmpty.array(errors),
  };
}

export function generateValidationErr(
  path: ValidationPath,
  restOfIssue: string
): ValidationResultError {
  return { path, issue: `${normalizePathArr(path)} ${restOfIssue}` };
}

function normalizePathArr(pathArr: ValidationPath): string {
  const PATH_DIRECTION_STRING = ' --> ' as const;
  return pathArr.join(PATH_DIRECTION_STRING);
}
