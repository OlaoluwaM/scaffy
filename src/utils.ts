#!/usr/bin/env zx
/* global chalk */

import 'zx/globals';
import { AnyObject, Primitive } from './compiler/types';

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
  return (initialValue: unknown) =>
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

export function withError<P extends unknown[], R extends unknown>(
  callback: (...args: P) => R
): (...args: P) => Promise<R> {
  return async (...args) => {
    const value = await callback(...args);
    if (!value) throw new Error('Falsy');
    return value;
  };
}

function capitalize(str: string): Capitalize<string> {
  const lowerCaseString = str.toLocaleLowerCase();
  const letterToCapitalize = lowerCaseString[0];

  return lowerCaseString.replace(
    letterToCapitalize,
    letterToCapitalize.toLocaleUpperCase()
  );
}
