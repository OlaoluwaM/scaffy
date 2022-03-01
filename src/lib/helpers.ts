#!/usr/bin/env zx
/* global fs, $, path */

import 'zx/globals';

import fsPromise from 'fs/promises';
import outputHelp from '../cmds/help';

import { error, info, success } from '../utils';
import {
  ExitCodes,
  ConfigSchema,
  Dependencies,
  ProjectDependencies,
  AnyFunction,
} from '../compiler/types';
import { ProcessOutput } from 'zx';

interface SamplePackageJson {
  version: string;
  dependencies: Dependencies;
  devDependencies: Dependencies;
}
export async function retrieveProjectDependencies(
  path: string
): Promise<ProjectDependencies> {
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

export async function parseScaffyConfig(path: string): Promise<ConfigSchema> {
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

export async function isCommandAvailable(commandName: string): Promise<boolean> {
  try {
    await $`command -v ${commandName}`;
    return true;
  } catch {
    error(`Hmm, looks like ${commandName} is not installed`);
    return false;
  }
}

interface EntityRemovalOptions {
  force?: boolean;
  recursive?: boolean;
}
export async function removeEntityAt(
  entityPath: string,
  entityName = '',
  options: EntityRemovalOptions = { force: true }
) {
  try {
    info(`Removing ${entityName}....`);
    console.log(entityPath);
    await fs.rm(entityPath, options);

    success(`${entityName} removed!`);
  } catch (err) {
    error(`Error occurred while trying to remove ${entityName}`);
    error((err as ProcessOutput).stderr);
  }
}

function isFile(entityPath: string): boolean {
  return !!path.extname(entityPath);
}

export async function doesPathExist(entityPath: string): Promise<boolean> {
  try {
    await fsPromise.stat(entityPath);
    return true;
  } catch (err) {
    return false;
  }
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
