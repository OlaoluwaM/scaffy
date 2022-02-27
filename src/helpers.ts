#!/usr/bin/env zx
/* global fs */

import 'zx/globals';

import outputHelp from './cmds/help';

import { error, filterOutPaths, includedInCollection, pipe } from './utils';
import {
  ConfigSchema,
  ProjectDependencies,
  Dependencies,
  ExitCodes,
} from './compiler/types';
import {
  CliApiObj,
  RawCliArgs,
  ParsedArguments,
  CliCommandsOptionsAliasesString,
} from './constants';

interface SamplePackageJson {
  version: string;
  dependencies: Dependencies;
  devDependencies: Dependencies;
}
export async function retrieveProjectDependencies(
  path: string
): Promise<ProjectDependencies> | never {
  try {
    const packageJsonObject = (await fs.readJSON(path)) as SamplePackageJson;

    return {
      version: packageJsonObject.version,
      deps: packageJsonObject.dependencies,
      devDeps: packageJsonObject.devDependencies,
    };
  } catch {
    return handleDepsRetrievalError();
  }
}
function handleDepsRetrievalError(): never {
  error('Failed to retrieve dependencies');
  error("Looks like there isn't a package.json file in your project yet");
  error('Please make sure to run this in the root directory of your project');
  return process.exit(1);
}

export async function parseScaffyConfig(path: string): Promise<ConfigSchema> | never {
  try {
    const configObject = (await fs.readJSON(path)) as ConfigSchema;
    return configObject;
  } catch {
    return handleConfigParseError();
  }
}
function handleConfigParseError(): never {
  error(
    'Looks like your are missing a `scaffy.json` file in the root directory of your project'
  );
  return process.exit(1);
}

export function determineAvailableToolsFromScaffyConfig(
  scaffyConfig: ConfigSchema,
  requestedToolNames: string[]
): string[] {
  const toolsInConfig = Object.keys(scaffyConfig);
  return requestedToolNames.filter(toolName => toolsInConfig.includes(toolName));
}

export function genericErrorHandler(
  msg: string,
  displayHelp: boolean = true,
  exitCode = ExitCodes.GENERAL
): never {
  error(msg);
  if (displayHelp) outputHelp();
  return process.exit(exitCode);
}
