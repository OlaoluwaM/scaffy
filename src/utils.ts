import fs from 'fs/promises';
import path from 'path';

import { chalk } from 'zx';
import { oraPromise } from 'ora';
import { AnyObject, FilePath, Primitive } from './compiler/types';
import { ErrorHook, ERROR_HOOK, DEFAULT_LEFT_PADDING_SIZE } from './constants';

export function info(msg: string, leftPaddingSize = DEFAULT_LEFT_PADDING_SIZE) {
  console.info(addSpacesToString(chalk.whiteBright.bold(msg), leftPaddingSize));
}

export function success(msg: string) {
  console.log(addSpacesToString(chalk.greenBright.bold(msg), DEFAULT_LEFT_PADDING_SIZE));
}

export function error(msg: string, shouldThrow = false) {
  console.error(addSpacesToString(chalk.red.bold(msg), DEFAULT_LEFT_PADDING_SIZE));
  if (shouldThrow) throw new Error(msg);
}

export function pipe(...fns: readonly ((...args: any[]) => any)[]) {
  return (initialValue?: unknown) =>
    fns.reduce((accumulatedValue, fnToRun) => fnToRun(accumulatedValue), initialValue);
}

export function includedInCollection<T extends U, U>(
  collection: readonly T[],
  itemToCheck: U
): itemToCheck is T {
  return collection.includes(itemToCheck as T);
}

export function doesObjectHaveProperty(obj: AnyObject, property: Primitive): boolean {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

type MultiLineString = string & { _type: 'multiLine' };
export function toMultiLineString(arr: string[]): MultiLineString {
  return arr.map(elem => `${elem}\n`).join('\n') as MultiLineString;
}

export function isSubset<PSubS extends PSupS, PSupS>(
  potentialSuperset: PSupS[],
  potentialSubset: PSubS[]
): boolean {
  return potentialSubset.some(potentialSubsetElem =>
    potentialSuperset.includes(potentialSubsetElem)
  );
}

export function isObjSubset<PSubS extends AnyObject, PSupS extends AnyObject>(
  potentialSupersetObj: PSupS,
  potentialSubsetObj: PSubS
): boolean {
  const potentialSubset = Object.entries(potentialSubsetObj);

  return potentialSubset.some(([key, value]) => {
    const propertyInSuperset = potentialSupersetObj[key];
    const propertyMatchesInSuperset = rawTypeOf(value) === rawTypeOf(propertyInSuperset);

    return !!propertyInSuperset && propertyMatchesInSuperset;
  });
}

export function filterOutPaths(arr: string[]): string[] {
  const pathRegex = /\.\.?\/[^\n"?:*<>|]+\.[A-z0-9]+/;
  return arr.filter(elem => !pathRegex.test(elem));
}

export function addException<P extends unknown[], R extends unknown>(
  callback: (...args: P) => R
) {
  return async (...args: P) => {
    const value = (await callback(...args)) as Awaited<R>;
    if (value === ERROR_HOOK || !value) throw new Error('An Error occurred');
    return value as Exclude<Awaited<R>, ErrorHook>;
  };
}

type TrueOnNullish<T> = T extends undefined | null ? true : T;
export function addExceptionHook<P extends unknown[], R extends unknown>(
  successCallback: (...args: P[]) => R,
  errorCallback = defaultErrorCallback
): () => Promise<TrueOnNullish<R> | ErrorHook> {
  return async () => {
    try {
      const returnValue = await successCallback();
      return (returnValue || true) as TrueOnNullish<R>;
    } catch (err) {
      errorCallback(err as Error | string);
      return ERROR_HOOK;
    }
  };
}
function defaultErrorCallback(err: Error | string) {
  if (typeof err === 'object') {
    error(err.message);
  } else error(err);
}

export function extractSetFromCollection<ArrA, ArrB>(
  collectionOne: ArrA[],
  collectionTwo: (ArrA | ArrB)[],
  excludeSubset = false
) {
  return collectionOne.filter(elem => {
    const elemIsInSubset = collectionTwo.includes(elem);
    return excludeSubset ? !elemIsInSubset : elemIsInSubset;
  });
}

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
  const desiredPropertyKeys = extractSetFromCollection(
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

type RawTypes = Lowercase<
  'Function' | 'Object' | 'Array' | 'Null' | 'Undefined' | 'String' | 'Number' | 'Boolean'
>;
export function rawTypeOf(value: unknown): RawTypes {
  return Object.prototype.toString
    .call(value)
    .replace(/\[|\]|object|\s/g, '')
    .toLocaleLowerCase() as RawTypes;
}

export const valueIs = {
  aString(val: unknown): val is string {
    return rawTypeOf(val) === 'string';
  },

  anArray(val: unknown): val is unknown[] {
    return rawTypeOf(val) === 'array';
  },

  anObject(val: unknown): val is AnyObject {
    return rawTypeOf(val) === 'object';
  },

  aNumber(val: unknown): val is number {
    return rawTypeOf(val) === 'number';
  },

  true(val: unknown): val is true {
    return val === true;
  },

  async aFile(val: string): Promise<(value: string) => asserts value is FilePath> {
    let errMsg: string | undefined;

    try {
      const status = await fs.stat(val);
      if (!status.isFile()) throw new TypeError(`${val} is not a file`);
    } catch (err) {
      errMsg = err instanceof TypeError ? err.message : (err as string);
    }

    return (value: string) => {
      const thereWasAValidationError = !!errMsg;
      let innerErrMsg: string | undefined;

      if (value !== val) {
        innerErrMsg =
          "The returned function's argument must equal the argument passed into the initial async function call";
      } else if (thereWasAValidationError) {
        innerErrMsg = errMsg;
      }

      if (innerErrMsg) throw new TypeError(innerErrMsg);
    };
  },
};

export type FileAssertionFn = Awaited<ReturnType<typeof valueIs.aFile>>;

export const isEmpty = {
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

export function extractBasenameFromPath(filepath: string): string {
  return path.basename(filepath);
}

export function normalizeArrForSentence(arrOfWords: string[]): string {
  switch (arrOfWords.length) {
    case 0:
    case 1:
      return arrOfWords[0] ?? '';
    case 2:
      return `${arrOfWords[0]} and ${arrOfWords[1]}`;
    default:
      return createGrammaticalSentence(arrOfWords);
  }
}

export function createGrammaticalSentence(arrOfWords: string[], lastSeparator: 'and' | 'or' = 'and'): string {
  const arrCopy = [...arrOfWords];

  const lastSentenceElement = `${lastSeparator} ${arrCopy.pop()}`;
  arrCopy.push(lastSentenceElement);

  const sentenceList = arrCopy.join(', ');
  return sentenceList;
}

interface AsyncProcessSpinnerOptions {
  initialText: string;
  onSuccessText: string;
  onFailText: string;
}
type IdleAsyncSpinnerProcess<PromiseType> = () => Promise<PromiseType>;
export class AsyncProcessSpinner<PromiseType> {
  #defaultSpinnerOptions = {
    initialText: 'Loading...',
    onSuccessText: 'Success!',
    onFailText: 'Error!',
  };

  #spinnerOptions: AsyncProcessSpinnerOptions;

  #asyncSpinnerProcess: IdleAsyncSpinnerProcess<PromiseType>;

  constructor(
    promise: Promise<PromiseType>,
    options: Partial<AsyncProcessSpinnerOptions>
  ) {
    this.#spinnerOptions = { ...this.#defaultSpinnerOptions, ...options };
    const oraCompatibleOptions = this.#mapPublicOptionsToImplementationOptions();

    this.#asyncSpinnerProcess = oraPromise.bind(
      null,
      promise,
      oraCompatibleOptions
    ) as IdleAsyncSpinnerProcess<PromiseType>;
  }

  #mapPublicOptionsToImplementationOptions(): {
    text: string;
    successText: string;
    failText: string;
  } {
    const { onSuccessText, onFailText, initialText } = this.#spinnerOptions;

    return {
      text: initialText,
      successText: onSuccessText,
      failText: onFailText,
    };
  }

  async startAsyncSpinnerWithPromise() {
    return this.#asyncSpinnerProcess();
  }
}

export function addSpacesToString(text: string, numberOfSpaces: number): string {
  const SPACE_CHAR = ' ';
  const spaces = SPACE_CHAR.repeat(numberOfSpaces);
  const spacesWithText = spaces.concat(text);
  return spacesWithText;
}

export function isSemverString(possibleSemVerString: string): boolean {
  // Gotten From https://github.com/sindresorhus/semver-regex/blob/main/index.js
  const SEMVER_REGEX =
    /(?:(?<=^v?|\sv?)(?:(?:0|[1-9]\d{0,9})\.){2}(?:0|[1-9]\d{0,9})(?:-(?:0|[1-9]\d*?|[\da-z-]*?[a-z-][\da-z-]*?){0,100}(?:\.(?:0|[1-9]\d*?|[\da-z-]*?[a-z-][\da-z-]*?))*?){0,100}(?:\+[\da-z-]+?(?:\.[\da-z-]+?)*?){0,100}\b){1,200}|latest/;

  return SEMVER_REGEX.test(possibleSemVerString);
}

// NOTE: Copy on write ops
export function objSet<
  Obj extends AnyObject,
  Prop extends string | number,
  NewValue extends Obj[Prop]
>(obj: Obj, property: Prop, value: NewValue) {
  return {
    ...obj,
    ...{ [property]: value },
  } as { [Key in keyof Obj | Prop]: Key extends Prop ? NewValue : Obj[Key] };
}
