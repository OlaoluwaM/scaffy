#!/usr/bin/env zx
/* global chalk */

import 'zx/globals';
import { AnyFunction, AnyObject, Primitive } from './compiler/types';
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

export function isSubset<T extends U, U>(superset: U[], subset: T[]): boolean {
  return subset.every(subsetElem => superset.includes(subsetElem));
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

type RawTypes = Lowercase<
  'Function' | 'Object' | 'Array' | 'Null' | 'Undefined' | 'String' | 'Number' | 'Boolean'
>;
export function rawTypeOf(value: unknown): RawTypes {
  return Object.prototype.toString
    .call(value)
    .replace(/\[|\]|object|\s/g, '')
    .toLocaleLowerCase() as RawTypes;
}

// TODO: Test this
export function pickObjPropsToAnotherObj<O extends AnyObject, P extends keyof O>(
  initialObject: O,
  targetProperties: P[]
) {
  const desiredPropertyKeys = extractSubsetFromCollection(
    Object.keys(initialObject),
    targetProperties
  ) as P[];

  const objWithDesiredProperties = desiredPropertyKeys.reduce((filteredObj, propName) => {
    /* eslint no-param-reassign: ["error", { "props": false }] */
    filteredObj.propName = initialObject.propName;
    return filteredObj;
  }, {} as AnyObject);

  return objWithDesiredProperties as Pick<O, P>;
}

export function isEmptyObject(obj: AnyObject): boolean {
  const EMPTY_OBJ_STRING = '{}' as const;
  return JSON.stringify(obj) === EMPTY_OBJ_STRING;
}

function capitalize(str: string): Capitalize<string> {
  const lowerCaseString = str.toLocaleLowerCase();
  const letterToCapitalize = lowerCaseString[0];

  return lowerCaseString.replace(
    letterToCapitalize,
    letterToCapitalize.toLocaleUpperCase()
  );
}
