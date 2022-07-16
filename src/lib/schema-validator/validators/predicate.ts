import { Validator } from '../types';
import { generateValidationResult } from './common';

type ExtractValidationType<ValidatorFn extends Validator<any>> =
  ValidatorFn extends Validator<infer R> ? R : never;

export function Or<Validators extends Validator<any>[]>(
  ...validators: Validators
): Validator<ExtractValidationType<Validators[number]>> {
  return vI => {
    const validationResults = validators.map(validator => validator(vI));
    const firstValidResult = validationResults.find(({ isValid }) => isValid);

    if (firstValidResult) return firstValidResult;

    const allErrors = validationResults.flatMap(({ errors }) => errors);
    return generateValidationResult(vI.value, allErrors);
  };
}
