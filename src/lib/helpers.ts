#!/usr/bin/env zx
/* global fs, $, path, globby */

import 'zx/globals';

import fsPromise from 'fs/promises';
import outputHelp from '../cmds/help';

import { ProcessOutput } from 'zx';
import { error, info, success, extractSubsetFromCollection } from '../utils';
import {
  ExitCodes,
  ConfigSchema,
  Dependencies,
  ProjectDependencies,
} from '../compiler/types';

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
  return extractSubsetFromCollection<string>(requestedToolNames, toolsInConfig);
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

export async function searchForFile(globPattern: string | string[]): Promise<string[]> {
  const patternMatches = await globby(globPattern);
  if (patternMatches.length === 0) throw new Error('Could not find any file matches');
  return patternMatches;
}

export function determineRootDirectory(): string {
  return path.resolve('./');
}

function isFile(entityPath: string): boolean {
  return !!path.extname(entityPath);
}
