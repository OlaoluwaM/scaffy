import { ExitCodes } from '../compiler/types';
import { genericErrorHandler } from '../helpers';
import { includedInCollection, pipe, filterOutPaths } from '../utils';
import {
  CliApiObj,
  RawCliArgs,
  ParsedArguments,
  CliCommandsOptionsAliasesString,
} from '../constants';

export default function parseArguments(
  cliArgs: string[],
  cliOptionObj: typeof CliApiObj
): ParsedArguments | never {
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
): CliCommandsOptionsAliasesString | never {
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
