import { Validator } from '../types';
import {
  bootstrapValidatorData,
  generateValidationResult,
  validatorTemplate,
} from './common';

export function NumberValidator(): Validator<number> {
  return vI => {
    const { value, errors } = bootstrapValidatorData(vI);

    const validatorTemplateFuncWithArrayValidationLogic = validatorTemplate<number>(() =>
      generateValidationResult(value, errors)
    );

    const validationResults = validatorTemplateFuncWithArrayValidationLogic(vI, 'number');

    return validationResults;
  };
}
