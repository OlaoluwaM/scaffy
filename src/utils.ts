#!/usr/bin/env zx
/* global chalk, $ */

import 'zx/globals';

import helpString from './cmds/help/index';
import { InstallationStatus, MultiLineString, AnyObject, Primitive } from './compiler/types';

export function info(msg: string) {
  console.log(chalk.whiteBright.bold(msg));
}

export function error(msg: string) {
  console.error(chalk.red.bold(msg));
}

export function pipe(...fns: readonly ((arg: any) => unknown)[]) {
  return (initialValue: unknown) =>
    fns.reduce((accumulatedValue, fnToRun) => fnToRun(accumulatedValue), initialValue);
}

export function includedInCollection<T extends U, U>(
  collection: readonly T[],
  itemToCheck: U
): itemToCheck is T {
  return collection.includes(itemToCheck as T);
}

export function getCliArguments(): string[] {
  return process.argv.slice(2);
}

export function genericErrorHandler(msg: string, displayHelp: boolean = true): never {
  error(msg);
  if (displayHelp) outputHelp();
  return process.exit(1);
}

export function outputHelp() {
  info(helpString);
}

export function doesObjectHaveProperty(obj: AnyObject, property: Primitive): boolean {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

function capitalize(str: string): Capitalize<string> {
  const lowerCaseString = str.toLocaleLowerCase();
  const letterToCapitalize = lowerCaseString[0];

  return lowerCaseString.replace(
    letterToCapitalize,
    letterToCapitalize.toLocaleUpperCase()
  );
}

export function toMultiLineString(arr: string[]): MultiLineString {
  return arr.map(elem => `${elem}\n`).join('\n') as MultiLineString;
}

export async function checkForCommand(commandName: string): Promise<InstallationStatus> {
  try {
    await $`command -v ${commandName}`;
    return InstallationStatus.Installed;
  } catch {
    error(`Hmm, looks like ${commandName} is not installed`);
    return InstallationStatus.Uninstalled;
  }
}

export async function removeFile(filePath: string) {
  try {
    await $`rm ${filePath}`;
  } catch {
    throw new Error(`Error occurred while trying to delete file at ${filePath}`);
  }
}
