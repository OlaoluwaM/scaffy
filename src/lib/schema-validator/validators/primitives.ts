import { Validator } from '../types';
import {
  validatorTemplate,
  bootstrapValidatorData,
  generateValidationResult,
} from './common';

export function NumberValidator(): Validator<number> {
  return vI => {
    const { value, errors } = bootstrapValidatorData(vI);

    const validatorTemplateFuncWithGeneralValidationLogic = validatorTemplate<number>(
      () => generateValidationResult(value, errors)
    );

    const validationResults = validatorTemplateFuncWithGeneralValidationLogic(
      vI,
      'number'
    );

    return validationResults;
  };
}
