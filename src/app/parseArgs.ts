import path from 'path';
import prompts from 'prompts';

import { EnumKeys } from '../compiler/types';
import { SCAFFY_CONFIG_GLOB, ExitCodes } from '../constants';
import { genericErrorHandler, searchForFile } from './helpers';
import {
  pipe,
  filterOutPaths,
  includedInCollection,
  extractSetFromCollection,
} from '../utils';

enum Commands {
  bootstrap = 'bootstrap',
  remove = 'remove',
  '--version' = '--version',
  '--help' = '--help',
}

enum Options {
  '--config' = '--config',
}

enum CommandAliases {
  b = 'b',
  rm = 'rm',
  '-h' = '-h',
  '-v' = '-v',
}

enum OptionAliases {
  '-c' = '-c',
}

export const cliApiObj = { ...Commands, ...Options, ...OptionAliases, ...CommandAliases };

export type CliApiString = keyof typeof cliApiObj;

export type CommandsApiString = Extract<
  CliApiString,
  EnumKeys<typeof Commands> | EnumKeys<typeof CommandAliases>
>;
type CliInfoApiString = Extract<CliApiString, '-v' | '-h' | '--help' | '--version'>;

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

const cliInfoApiStrings = ['-h', '--help', '--version', '-v'] as CliInfoApiString[];

export default async function parseArguments(
  cliArgs: RawCliArgs
): Promise<ParsedArguments> {
  const [possibleCommand, restOfCliArgs] = cliArgs;

  const { command, isCliInfoCmd } = extractCommandInsightFromCliArgs(possibleCommand);
  let parsedArgsObj: ParsedArguments;

  if (isCliInfoCmd) {
    parsedArgsObj = {
      command,
      tools: [],
      pathToScaffyConfig: '',
    };
  } else {
    parsedArgsObj = {
      command,
      tools: extractToolsFromCliArgs(restOfCliArgs),
      pathToScaffyConfig: await extractPathToConfFromCliArgs(restOfCliArgs),
    };
  }

  return parsedArgsObj;
}

interface CommandInsight {
  command: CommandsApiString;
  isCliInfoCmd: boolean;
}

function extractCommandInsightFromCliArgs(
  possibleCommand: PossibleCommand
): CommandInsight {
  if (!includedInCollection(cliCommandsApiArr, possibleCommand)) {
    return genericErrorHandler(
      `${possibleCommand} is not a supported command`,
      true,
      ExitCodes.COMMAND_NOT_FOUND
    );
  }

  const commandInsight: CommandInsight = {
    command: possibleCommand,
    isCliInfoCmd: false,
  };

  if (includedInCollection(cliInfoApiStrings, possibleCommand)) {
    commandInsight.isCliInfoCmd = true;
  }

  return commandInsight;
}

function extractToolsFromCliArgs(restOfCliArgs: RestOfCliArgs): string[] {
  const parsedTools = pipe(
    extractSetFromCollection.bind(null, restOfCliArgs, cliApiStringArr, true),
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

async function getDesiredScaffyConfigMatch(
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
