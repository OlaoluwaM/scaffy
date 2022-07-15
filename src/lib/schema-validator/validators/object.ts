import { OBJ_PATH_KEY, VALID_RESULT } from '../constants';
import { default as defaultValidatorOptionsFor, ObjValidationOptions } from './config';
import { isEmpty, nonValidResults, pickObjPropsToAnotherObj } from '../utils';
import {
  validatorTemplate,
  generateValidationErr,
  generateValidationResult,
} from './common';
import {
  AnyObject,
  Validator,
  ValidatorInput,
  ValidationPath,
  ValidationResult,
  ValidationResultError,
  InterfaceToValidatorSchema,
} from '../types';

export default function ObjectValidator<ExpectedInterface extends AnyObject>(
  schema: InterfaceToValidatorSchema<ExpectedInterface>,
  validationOptions: Partial<ObjValidationOptions> = defaultValidatorOptionsFor.object
): Validator<ExpectedInterface> {
  return vI => {
    const validatorTemplateFuncWithArrayValidationLogic =
      validatorTemplate<ExpectedInterface>(
        objValidationLogic<ExpectedInterface>(vI, schema)
      );

    const validationResults = validatorTemplateFuncWithArrayValidationLogic(
      vI,
      'object',
      validationOptions as ObjValidationOptions
    );

    return validationResults;
  };
}

function objValidationLogic<ExpectedInterface extends AnyObject>(
  vI: ValidatorInput<ExpectedInterface>,
  schema: InterfaceToValidatorSchema<ExpectedInterface>
) {
  return (validationOptions: ObjValidationOptions) => {
    const { value } = vI;
    const { filterViolations } = validationOptions;

    let errorsDiscovered = determineObjStructureErrors<ExpectedInterface>(vI, schema);
    if (!filterViolations) return generateValidationResult(value, errorsDiscovered);

    const filtrationResult = filterViolatingProperties(vI, errorsDiscovered);
    const { finalObj, filtrationErrors } = filtrationResult;

    errorsDiscovered = filtrationErrors;
    return generateValidationResult(finalObj as typeof value, errorsDiscovered);
  };
}

function determineObjStructureErrors<ExpectedInterface extends AnyObject>(
  vI: ValidatorInput<ExpectedInterface>,
  schema: InterfaceToValidatorSchema<ExpectedInterface>
) {
  type PropertyType = ExpectedInterface[keyof ExpectedInterface];

  const objValidationResults = Object.entries(schema).map(
    ([propertyName, validatorFn]: [string, Validator<PropertyType>]) => {
      const propertyPath = [...vI.path, `${OBJ_PATH_KEY}: ${propertyName}`];
      const propertyValue = vI.value[propertyName];

      const propertyValidityResult = determineObjPropertyValidityResult<PropertyType>(
        propertyPath,
        propertyValue,
        validatorFn
      );

      return propertyValidityResult;
    }
  ) as ValidationResult<PropertyType>[];

  const nonValidObjPropertyResults = objValidationResults.filter(nonValidResults);
  const objPropertyValidityErrors = nonValidObjPropertyResults.flatMap(
    ({ errors: errs }) => errs
  );

  return objPropertyValidityErrors;
}

function determineObjPropertyValidityResult<PropertyType>(
  propertyPath: ValidationPath,
  propertyValue: unknown,
  validatorFn: Validator<PropertyType>
): ValidationResult<PropertyType | undefined> | typeof VALID_RESULT {
  if (propertyValue === undefined) {
    return {
      value: propertyValue as undefined,
      isValid: false,
      errors: [generateValidationErr(propertyPath, 'does not exist in object')],
    } as ValidationResult<undefined>;
  }

  const validationResult = validatorFn({
    value: propertyValue as PropertyType,
    path: propertyPath,
  });

  if (validationResult.isValid) return VALID_RESULT;
  return validationResult;
}

function filterViolatingProperties<T extends AnyObject>(
  vI: ValidatorInput<T>,
  errors: ValidationResultError[]
) {
  const propertiesWithSchemaViolations = extractSchemaViolatingProperties(errors);

  const objWithoutViolatingProps = pickObjPropsToAnotherObj(
    vI.value,
    propertiesWithSchemaViolations,
    true
  );

  const filtrationErrors = [];

  if (isEmpty.object(objWithoutViolatingProps)) {
    filtrationErrors.push(
      generateValidationErr(vI.path, 'Object contained only invalid properties')
    );
  }

  return { finalObj: objWithoutViolatingProps, filtrationErrors };
}

function extractSchemaViolatingProperties(errors: ValidationResultError[]): string[] {
  return errors.map(({ path }) => {
    const propString = path
      .filter(pathStr => pathStr.startsWith(OBJ_PATH_KEY))
      .at(-1) as string;

    const propertyName = propString.split(' ').at(-1);
    return propertyName as string;
  });
}
