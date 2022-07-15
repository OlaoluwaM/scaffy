import defaultValidatorOptionsFor, { StringValidatorOptions } from './config';

import { isEmpty, createGrammaticalSentence } from '../utils';
import {
  validatorTemplate,
  generateValidationErr,
  generateValidationResult,
} from './common';
import {
  Validator,
  ValidatorInput,
  ValidationResult,
  ValidationResultError,
} from '../types';

type PartialStringValidatorOptions = Partial<StringValidatorOptions>;
type DetermineStringValidationValue<
  ValidationOptions extends PartialStringValidatorOptions
> = ValidationOptions['options'] extends readonly string[]
  ? ValidationOptions['options']['length'] extends 0
    ? string
    : ValidationOptions['options'][number]
  : string;

export default function StringValidator<
  ValidationOptions extends PartialStringValidatorOptions
>(
  validationOptions: ValidationOptions = {} as ValidationOptions
): Validator<DetermineStringValidationValue<ValidationOptions>> {
  return vI => {
    const validatorTemplateFuncWitStringValidationLogic = validatorTemplate<string>(
      performStringSpecificValidation(vI)
    );

    const validationResults = validatorTemplateFuncWitStringValidationLogic(
      vI,
      'string',
      {
        ...defaultValidatorOptionsFor.string,
        ...validationOptions,
      }
    );

    return validationResults;
  };
}

function performStringSpecificValidation(vI: ValidatorInput<string>) {
  return (stringValidatorOptions: StringValidatorOptions): ValidationResult<string> => {
    const { options } = stringValidatorOptions;
    let errorsDiscovered: ValidationResultError[] = [];

    if (!isEmpty.array(options as unknown[])) {
      const optionMatchErrors = handleOptionsMatchForString(options, vI);
      errorsDiscovered = errorsDiscovered.concat(optionMatchErrors);
    }

    return generateValidationResult(vI.value, errorsDiscovered);
  };
}

function handleOptionsMatchForString(
  matchOptions: StringValidatorOptions['options'],
  vI: ValidatorInput<string>
): ValidationResultError[] {
  const { value, path } = vI;
  const isValueAMatch = matchOptions.includes(value);

  if (isValueAMatch) return [];
  return [
    generateValidationErr(
      path,
      `is neither ${createGrammaticalSentence(matchOptions as string[], 'or')}`
    ),
  ];
}
