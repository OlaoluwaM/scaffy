import { ExitCodes } from '../compiler/types';
import { genericErrorHandler } from './helpers';
import { includedInCollection, pipe, filterOutPaths } from '../utils';

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

export default function parseArguments(
  cliArgs: string[],
  cliOptionObj: typeof CliApiObj
): ParsedArguments {
  const cliOptionsArr = Object.keys(cliOptionObj) as CliCommandsOptionsAliasesString[];

  const argsObj: ParsedArguments = {
    command: extractCommandFromCliArgs(cliArgs, cliOptionsArr),
    tools: extractToolsFromCliArgs(cliArgs, cliOptionsArr),
    pathToScaffyConfig: extractPathToConfFromCliArgs(cliArgs, cliOptionObj),
  };

  return argsObj;
}

function extractCommandFromCliArgs(
  cliArgs: RawCliArgs,
  cliOptions: CliCommandsOptionsAliasesString[]
): CliCommandsOptionsAliasesString {
  if (includedInCollection(cliOptions, cliArgs[0])) {
    return cliArgs[0];
  }

  return genericErrorHandler(
    `${cliArgs[0]} is not a supported command`,
    true,
    ExitCodes.COMMAND_NOT_FOUND
  );
}

function extractToolsFromCliArgs(
  cliArgs: RawCliArgs,
  cliOptionsArr: CliCommandsOptionsAliasesString[]
): string[] {
  const rawTools = cliArgs.slice(1);
  const parsedTools = pipe(
    filterOutCliOptions(cliOptionsArr),
    filterOutPaths
  )(rawTools) as string[];
  return parsedTools;
}

function filterOutCliOptions(
  cliOptionsArr: CliCommandsOptionsAliasesString[]
): (arr: RawCliArgs) => string[] {
  return (arr: RawCliArgs) =>
    arr.filter(elem => !cliOptionsArr.includes(elem as CliCommandsOptionsAliasesString));
}

function extractPathToConfFromCliArgs(
  cliArgs: RawCliArgs,
  cliApi: typeof CliApiObj
): string {
  const indexOfPathOption = cliArgs.findIndex(arg =>
    includedInCollection([cliApi['--config'], cliApi['-c']], arg)
  );

  if (indexOfPathOption === -1) return './scaffy.json';
  return cliArgs[indexOfPathOption + 1];
}

function getCliArguments(): RawCliArgs {
  return process.argv.slice(2);
}
