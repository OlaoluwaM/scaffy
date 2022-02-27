#!/usr/bin/env zx
/* global path */

import 'zx/globals';
import { fileURLToPath } from 'url';

enum Commands {
  install = 'install',
  uninstall = 'uninstall',
  '--version' = '--version',
}

enum Options {
  '--help' = '--help',
  '--config' = '--config',
}

enum Aliases {
  i = 'i',
  un = 'un',
  '-h' = '-h',
  '-v' = '-v',
  '-c' = '-c',
}

export const CliApiObj = { ...Commands, ...Options, ...Aliases };

export type CliCommandsOptionsAliasesString = keyof typeof CliApiObj;
export type RawCliArgs = (CliCommandsOptionsAliasesString | string)[];

export interface ParsedArguments {
  command: CliCommandsOptionsAliasesString;
  tools: string[];
  pathToScaffyConfig?: string;
}

export const CliCommandsOptionsAliasesStringArr = Object.keys(
  CliApiObj
) as CliCommandsOptionsAliasesString[];

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
