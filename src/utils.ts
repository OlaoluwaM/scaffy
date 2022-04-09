import path from 'path';

import { chalk } from 'zx';
import { AnyObject, Primitive } from './compiler/types';
import { ErrorHook, ERROR_HOOK } from './constants';

export function info(msg: string) {
  console.info(chalk.whiteBright.bold(msg));
}

export function success(msg: string) {
  console.log(chalk.greenBright.bold(msg));
}

export function error(msg: string) {
  console.error(chalk.red.bold(msg));
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

// TODO: Test this
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
};

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

export function normalizeArrForSentence(arr: unknown[]): string {
  return arr.join(' ');
}

// NOTE: Copy on write ops
export function objSet<
  Obj extends AnyObject,
  Prop extends string | number,
  NewValue extends Obj[Prop]
>(obj: Obj, property: Prop, value: NewValue): Obj & { [key in Prop]: NewValue } {
  return {
    ...obj,
    ...{ [property]: value },
  };
}
