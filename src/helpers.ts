#!/usr/bin/env zx
/* global chalk */

import 'zx/globals';

import { cliApiStrings, helpString } from './constants.js';

import type { ParsedArguments } from './constants.js';

export function info(msg: string) {
  console.log(chalk.whiteBright.bold(msg));
}

export function error(msg: string) {
  console.error(chalk.red.bold(msg));
}

export function getCliArguments(): string[] {
  return process.argv.slice(2);
}

export function parseArguments(): ParsedArguments | never {
  const cliArgs = getCliArguments();

  if (includedInCollection(cliApiStrings, cliArgs[0])) {
    return cliArgs as ParsedArguments;
  }

  return genericErrorHandler(`${cliArgs[0]} is not a supported command`);
}

function includedInCollection<T extends U, U>(
  collection: readonly T[],
  itemToCheck: U
): itemToCheck is T {
  return collection.includes(itemToCheck as T);
}

export function outputHelp() {
  info(helpString);
}

export function genericErrorHandler(msg: string): never {
  error(msg);
  outputHelp();
  return process.exit(1);
}
