import defaultValidatorOptionsFor from './config';

import { nonValidResults } from '../utils';
import { ARR_PATH_KEY, VALID_RESULT } from '../constants';
import { generateValidationResult, validatorTemplate } from './common';
import {
  Validator,
  ValidationPath,
  ValidatorInput,
  ValidationResultError,
  BaseValidatorOptions,
} from '../types';

export default function ArrayValidator<ElemType>(
  elementValidator: Validator<ElemType>,
  validationOptions = defaultValidatorOptionsFor.array
): Validator<ElemType[]> {
  return vI => {
    const validatorTemplateFuncWithArrayValidationLogic = validatorTemplate<ElemType[]>(
      arrayValidationLogic(vI, elementValidator)
    );

    const validationResults = validatorTemplateFuncWithArrayValidationLogic(
      vI,
      'array',
      validationOptions
    );

    return validationResults;
  };
}

function arrayValidationLogic<ElemType>(
  vI: ValidatorInput<ElemType[]>,
  elementValidator: Validator<ElemType>
) {
  return (normalizedValidationOptions: BaseValidatorOptions) => {
    const { value, path: currentPath } = vI;

    const errorsDiscovered = determineArrValidity(
      vI.value,
      currentPath,
      elementValidator
    );

    return generateValidationResult(value, errorsDiscovered);
  };
}

function determineArrValidity<SingleElementType>(
  arrToCheck: SingleElementType[],
  startingPath: string[],
  elementValidator: Validator<SingleElementType>
): ValidationResultError[] {
  const elementValidityResults = arrToCheck.map((elem, ind) => {
    const elemPath = [...startingPath, `${ARR_PATH_KEY}: ${ind}`];

    return determineSingleArrElementValidityResults<SingleElementType>(
      elemPath,
      elem,
      elementValidator
    );
  });

  const elementValidationErrors = elementValidityResults.filter(
    nonValidResults
  ) as ValidationResultError[];

  return elementValidationErrors;
}

function determineSingleArrElementValidityResults<ElementType>(
  elemPath: ValidationPath,
  elem: ElementType,
  elementValidator: Validator<ElementType>
): ValidationResultError | typeof VALID_RESULT {
  const validationResult = elementValidator({ value: elem, path: elemPath });
  if (validationResult.isValid) return VALID_RESULT;

  const { issue } = validationResult.errors[0];
  return { path: elemPath, issue };
}
