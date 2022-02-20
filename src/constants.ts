#!/usr/bin/env zx
/* global path */

import 'zx/globals';
import { fileURLToPath } from 'url';

enum Commands {
  install = 'install',
  uninstall = 'uninstall',
}

enum Options {
  '--help' = '--help',
  '--version' = '--version',
}

enum Aliases {
  i = 'i',
  un = 'un',
  '-h' = '-h',
  '-v' = '-v',
}

export const CliApi = { ...Commands, ...Options, ...Aliases };

export type CliApiString = keyof typeof CliApi;
export type ParsedArguments = [CliApiString, ...string[]];

export const cliApiStrings = Object.keys(CliApi) as CliApiString[];

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const projectRootDir = path.resolve('./');
