#!/usr/bin/env zx
/* global fs */

import 'zx/globals';
import { ParsedArguments, cliApiStrings } from './constants';
import { ProjectDependencies, SamplePackageJson, ConfigSchema } from './globals';
import { error, getCliArguments, includedInCollection, genericErrorHandler } from './utils';

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

export function parseArguments(): ParsedArguments | never {
  const cliArgs = getCliArguments();

  if (includedInCollection(cliApiStrings, cliArgs[0])) {
    return cliArgs as ParsedArguments;
  }

  return genericErrorHandler(`${cliArgs[0]} is not a supported command`);
}

export function determineAvailableToolsFromInput(
  scaffyConfig: ConfigSchema,
  requestedToolNames: string[]
): string[] {
  const toolsInConfig = Object.keys(scaffyConfig);
  return requestedToolNames.filter(toolName => toolsInConfig.includes(toolName));
}
