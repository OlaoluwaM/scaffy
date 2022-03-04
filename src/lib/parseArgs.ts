#!/usr/bin/env zx
/* globals */
import 'zx/globals';

import path from 'path';
import prompts from 'prompts';

import { SCAFFY_CONFIG_GLOB } from '../constants';
import { EnumKeys, ExitCodes } from '../compiler/types';
import { genericErrorHandler, searchForFile } from './helpers';
import {
  pipe,
  filterOutPaths,
  includedInCollection,
  extractSubsetFromCollection,
} from '../utils';

enum Commands {
  install = 'install',
  uninstall = 'uninstall',
  '--version' = '--version',
  '--help' = '--help',
}

enum Options {
  '--config' = '--config',
}

enum CommandAliases {
  i = 'i',
  un = 'un',
  '-h' = '-h',
  '-v' = '-v',
}

enum OptionAliases {
  '-c' = '-c',
}

export const cliApiObj = { ...Commands, ...Options, ...OptionAliases, ...CommandAliases };

export type CliApiString = keyof typeof cliApiObj;

type CommandsApiString = Extract<
  CliApiString,
  EnumKeys<typeof Commands> | EnumKeys<typeof CommandAliases>
>;

type PossibleCommand = string;
type RestOfCliArgs = string[];

export type RawCliArgs = [PossibleCommand, RestOfCliArgs];

export interface ParsedArguments {
  command: CommandsApiString;
  tools: string[];
  pathToScaffyConfig: string;
}

export const cliApiStringArr = Object.keys(cliApiObj) as CliApiString[];
const cliCommandsApiArr = Object.keys({
  ...Commands,
  ...CommandAliases,
}) as CommandsApiString[];

export default async function parseArguments(
  cliArgs: RawCliArgs
): Promise<ParsedArguments> {
  const [possibleCommand, restOfCliArgs] = cliArgs;

  const parsedArgsObj: ParsedArguments = {
    command: extractCommandFromCliArgs(possibleCommand, cliCommandsApiArr),
    tools: extractToolsFromCliArgs(restOfCliArgs),
    pathToScaffyConfig: await extractPathToConfFromCliArgs(restOfCliArgs),
  };

  return parsedArgsObj;
}

function extractCommandFromCliArgs(
  possibleCommand: PossibleCommand,
  commandsApiArr: CommandsApiString[]
): CommandsApiString {
  if (includedInCollection(commandsApiArr, possibleCommand)) {
    return possibleCommand;
  }

  return genericErrorHandler(
    `${possibleCommand} is not a supported command`,
    true,
    ExitCodes.COMMAND_NOT_FOUND
  );
}

function extractToolsFromCliArgs(restOfCliArgs: RestOfCliArgs): string[] {
  const parsedTools = pipe(
    extractSubsetFromCollection.bind(null, restOfCliArgs, cliApiStringArr, true),
    filterOutPaths
  )() as string[];

  return parsedTools;
}

async function extractPathToConfFromCliArgs(cliArgs: string[]): Promise<string> {
  const indexOfPathOption = cliArgs.findIndex(
    arg => arg === cliApiObj['--config'] || arg === cliApiObj['-c']
  );

  // eslint-disable-next-line no-return-await
  if (indexOfPathOption === -1) return await getDesiredScaffyConfigMatch();

  const indexOfActualPath = indexOfPathOption + 1;
  return cliArgs[indexOfActualPath];
}

// For testing purposes only
export async function getDesiredScaffyConfigMatch(
  globPattern = SCAFFY_CONFIG_GLOB
): Promise<string> {
  const patternMatches = await searchForFile(globPattern);

  const { desiredConfig } = await prompts({
    type: 'select',
    name: 'desiredConfig',
    message: 'Multiple configuration files found. Please select one: ',
    choices: createChoicesForMultipleDetectedConfigs(patternMatches),
  });

  return desiredConfig;
}

function createChoicesForMultipleDetectedConfigs(
  configs: string[]
): { title: string; value: string }[] {
  return configs.map(configPath => ({
    title: `${path.basename(configPath)} in ${path.dirname(configPath)}`,
    value: configPath,
  }));
}

export function extractCliArgs(): string[] {
  return process.argv.slice(2);
}

export function sortOutRawCliArgs(rawArgs: string[]): RawCliArgs {
  const possibleCommand = rawArgs[0];
  const restOfCliArgs = rawArgs.slice(1);

  return [possibleCommand, restOfCliArgs];
}
