import { ValidationResultError, Validator } from '../types';
import { generateValidationResult, validatorTemplate } from './common';

export function StringValidator(): Validator<string> {
  return vI => {
    const { value } = vI;
    const errors: ValidationResultError[] = [];

    const validatorTemplateFuncWithArrayValidationLogic = validatorTemplate<string>(() =>
      generateValidationResult(value, errors)
    );

    const validationResults = validatorTemplateFuncWithArrayValidationLogic(vI, 'string');

    return validationResults;
  };
}

export function NumberValidator(): Validator<number> {
  return vI => {
    const { value } = vI;
    const errors: ValidationResultError[] = [];

    const validatorTemplateFuncWithArrayValidationLogic = validatorTemplate<number>(() =>
      generateValidationResult(value, errors)
    );

    const validationResults = validatorTemplateFuncWithArrayValidationLogic(vI, 'number');

    return validationResults;
  };
}
