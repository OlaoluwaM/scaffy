#!/usr/bin/env zx
/* global chalk */

import 'zx/globals';

import helpString from './cmds/help';

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

export function genericErrorHandler(msg: string): never {
  error(msg);
  outputHelp();
  return process.exit(1);
}
export function outputHelp() {
  info(helpString);
}
