type ValidationPath = string[];

interface ValidatorInput<T = unknown> {
  readonly value: T;
  readonly path: ValidationPath;
}

interface ValidationResultError {
  readonly path: ValidationPath;
  readonly issue: string;
}

interface ValidationResult<TVal> {
  readonly value: TVal;
  readonly isValid: boolean;
  readonly errors: ValidationResultError[];
}

export type InterfaceToValidatorSchema<I> = {
  [Key in keyof I]: Validator<I[Key]>;
};

type ValidatorSchemaToInterface<VS> = {
  [Key in keyof VS]: VS[Key] extends Validator<infer R> ? R : VS[Key];
};

type Validator<T = any> = (vI: ValidatorInput<T>) => ValidationResult<T>;

type AnyObject = Record<string | number, any>;

const OBJ_PATH_KEY = 'Property' as const;
const ARR_PATH_KEY = 'Index' as const;

interface BaseValidatorOptions {
  allowEmpty?: boolean;
}

interface ObjValidationOptions extends BaseValidatorOptions {
  filterViolations?: boolean;
}

const defaultObjValidationOptions: ObjValidationOptions = {
  filterViolations: false,
  allowEmpty: true,
};

export function ObjectValidator<TInterface extends AnyObject>(
  schema: InterfaceToValidatorSchema<TInterface>,
  validationOptions: ObjValidationOptions = defaultObjValidationOptions
): Validator<TInterface> {
  return vI => {
    const { path, value, errors } = bootstrapValidatorData(vI);
    const { allowEmpty, filterViolations } = validationOptions;

    const isObj = valueIs.anObject(value);
    if (!isObj) {
      return generateValidationResult(value, [
        generateValidationErr(path, 'is not an object'),
      ]);
    }

    const isEmptyObj = isEmpty.obj(value as AnyObject);

    if (isEmptyObj && !allowEmpty) {
      return generateValidationResult(value, [
        generateValidationErr(path, 'is an empty object'),
      ]);
    }

    type MemberType = TInterface[keyof TInterface];

    const objMemberValidityResults = Object.entries(schema)
      .map(([propName, validatorFn]: [string, Validator<MemberType>]) => {
        const memberPath = [...vI.path, `${OBJ_PATH_KEY}: ${propName}`];
        const propValue = vI.value[propName];

        const memberValidityResult = determineObjMemberValidity<MemberType>(
          memberPath,
          propValue,
          validatorFn
        );

        return memberValidityResult;
      })
      .filter(Boolean) as ValidationResult<MemberType>[];

    const objMemberValidityErrors = objMemberValidityResults.flatMap(
      ({ errors: errs }) => errs
    );

    let errorsDiscovered = errors.concat(objMemberValidityErrors);
    let returnValue = value;

    if (filterViolations) {
      const filtrationResult = filterViolatingProperties(vI, errorsDiscovered);
      const { finalObj, filtrationErrors } = filtrationResult;

      returnValue = finalObj as typeof value;
      errorsDiscovered = filtrationErrors;
    }

    return generateValidationResult(returnValue, errorsDiscovered);
  };
}

function determineObjMemberValidity<MemberType>(
  memberPath: ValidationPath,
  propValue: unknown,
  validatorFn: Validator<MemberType>
): ValidationResult<MemberType | undefined> | false {
  if (propValue === undefined) {
    return {
      value: propValue as undefined,
      isValid: false,
      errors: [generateValidationErr(memberPath, 'does not exist in object')],
    } as ValidationResult<undefined>;
  }

  const validationResult = validatorFn({
    value: propValue as MemberType,
    path: memberPath,
  });

  if (validationResult.isValid) return false;
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

  if (isEmpty.obj(objWithoutViolatingProps)) {
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

    const propName = propString.split(' ').at(-1);
    return propName as string;
  });
}

interface ArrayValidatorOptions extends BaseValidatorOptions {}

const defaultArrayValidatorOptions: ArrayValidatorOptions = {
  allowEmpty: true,
};

export function ArrayValidator<ElemType>(
  elementValidator: Validator<ElemType>,
  validationOptions: ArrayValidatorOptions = defaultArrayValidatorOptions
): Validator<ElemType[]> {
  return vI => {
    const { path, value, errors } = bootstrapValidatorData(vI);

    const isArr = valueIs.anArray(value);
    if (!isArr) {
      errors.push(generateValidationErr(path, 'is not an array'));
      return generateValidationResult(value, errors);
    }

    const isEmptyArr = isEmpty.array(value);
    const { allowEmpty } = validationOptions;

    if (isEmptyArr && !allowEmpty) {
      errors.push(generateValidationErr(path, 'array is empty'));
      return generateValidationResult(value, errors);
    }

    const elementValidityResults = value
      .map((elem, ind) => {
        const elemPath = [...vI.path, `${ARR_PATH_KEY}: ${ind}`];
        return determineArrElementValidity<ElemType>(elemPath, elem, elementValidator);
      })
      .filter(Boolean) as ValidationResultError[];

    const errorsDiscovered = errors.concat(elementValidityResults);
    return generateValidationResult(value, errorsDiscovered);
  };
}

function determineArrElementValidity<ElemType>(
  elemPath: ValidationPath,
  elem: ElemType,
  elementValidator: Validator<ElemType>
): ValidationResultError | false {
  const validationResult = elementValidator({ value: elem, path: elemPath });
  if (validationResult.isValid) return false;

  const { issue } = validationResult.errors[0];
  return { path: elemPath, issue };
}

export function StringValidator(): Validator<string> {
  return vI => {
    const { path, value, errors } = bootstrapValidatorData(vI);

    const isString = valueIs.aString(value);
    if (!isString) errors.push(generateValidationErr(path, 'is not a string'));

    const isEmptyString = isEmpty.string(value);
    if (isEmptyString) errors.push(generateValidationErr(path, 'is an empty string'));

    return generateValidationResult(value, errors);
  };
}

export function NumberValidator(): Validator<number> {
  return vI => {
    const { path, value, errors } = bootstrapValidatorData(vI);

    const isANumber = valueIs.aNumber(value);
    if (!isANumber) errors.push(generateValidationErr(path, 'is not a number'));

    return generateValidationResult(value, errors);
  };
}

function bootstrapValidatorData<T>(vI: ValidatorInput<T>): {
  value: ValidatorInput<T>['value'];
  path: ValidationPath;
  errors: ValidationResultError[];
} {
  const { path, value } = vI;
  const errors: ValidationResultError[] = [];

  return { path, value, errors };
}

function generateValidationResult<T>(
  val: T,
  errors: ValidationResultError[]
): ValidationResult<T> {
  return {
    errors,
    value: val,
    isValid: isEmpty.array(errors),
  };
}

function generateValidationErr(
  path: ValidationPath,
  restOfIssue: string
): ValidationResultError {
  return { path, issue: `${normalizePathArr(path)} ${restOfIssue}` };
}

function normalizePathArr(pathArr: ValidationPath): string {
  const PATH_DIRECTION_STRING = ' --> ' as const;
  return pathArr.join(PATH_DIRECTION_STRING);
}

// Module Boundary
// Duplicated from utils file in order to make this lib standalone and independent
type RawTypes = Lowercase<
  'Function' | 'Object' | 'Array' | 'Null' | 'Undefined' | 'String' | 'Number' | 'Boolean'
>;
export function rawTypeOf(value: unknown): RawTypes {
  return Object.prototype.toString
    .call(value)
    .replace(/\[|\]|object|\s/g, '')
    .toLocaleLowerCase() as RawTypes;
}

const valueIs = {
  aNumber(val: unknown): val is number {
    return rawTypeOf(val) === 'number' && !Number.isNaN(val);
  },

  aString(val: unknown): val is string {
    return rawTypeOf(val) === 'string';
  },

  anArray(val: unknown): val is unknown[] {
    return rawTypeOf(val) === 'array';
  },

  anObject(val: unknown): val is AnyObject {
    return rawTypeOf(val) === 'object';
  },
};

const isEmpty = {
  obj(possiblyEmptyObj: AnyObject): boolean {
    const hasNoProperties = Object.keys(possiblyEmptyObj).length === 0;
    return hasNoProperties;
  },

  array(possiblyEmptyArr: unknown[]): boolean {
    return possiblyEmptyArr.length === 0;
  },

  string(possiblyEmptyString: string): boolean {
    const EMPTY_STRING = '' as const;
    return possiblyEmptyString === EMPTY_STRING;
  },
};

export function pickObjPropsToAnotherObj<O extends {}, P extends keyof O>(
  initialObject: O,
  targetProperties: P[],
  excludeProperties: true
): Omit<O, P>;
export function pickObjPropsToAnotherObj<O extends {}, P extends keyof O>(
  initialObject: O,
  targetProperties: P[],
  excludeProperties: false
): Pick<O, P>;
export function pickObjPropsToAnotherObj<O extends {}, P extends keyof O>(
  initialObject: O,
  targetProperties: P[]
): Pick<O, P>;
export function pickObjPropsToAnotherObj<O extends {}, P extends keyof O>(
  initialObject: O,
  targetProperties: P[],
  excludeProperties?: boolean
) {
  const desiredPropertyKeys = extractSubsetFromCollection(
    Object.keys(initialObject),
    targetProperties,
    excludeProperties
  ) as P[];

  const objWithDesiredProperties = desiredPropertyKeys.reduce((filteredObj, propName) => {
    /* eslint no-param-reassign: ["error", { "props": false }] */
    filteredObj[propName] = initialObject[propName];
    return filteredObj;
  }, {} as O);

  return objWithDesiredProperties;
}

export function extractSubsetFromCollection<R>(
  superset: unknown[],
  subset: unknown[],
  excludeSubset = false
) {
  return superset.filter(elem => {
    const elemIsInSubset = subset.includes(elem);
    return excludeSubset ? !elemIsInSubset : elemIsInSubset;
  }) as R[];
}
