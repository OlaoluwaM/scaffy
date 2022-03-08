#!/usr/bin/env zx
/* global $ */

import 'zx/globals';

import path from 'path';
import {
  parseScaffyConfig,
  determineRootDirectory,
  parseProjectDependencies,
} from '../lib/helpers';
import {
  info,
  error,
  isEmpty,
  pickObjPropsToAnotherObj,
  extractSubsetFromCollection,
} from '../utils';

import type { ConfigSchema, ProjectDependencies } from '../compiler/types';
import download from '../lib/downloadFile';

export default async function install(pathToScaffyConfig: string, tools: string[]) {
  // const projectDependencies = await getProjectDependencies();
  const scaffyConfObj = await parseScaffyConfig(pathToScaffyConfig);
  const toolsInScaffyConfig = filterToolsInScaffyConfig(tools, scaffyConfObj);

  await installTools(scaffyConfObj, toolsInScaffyConfig);
}

function filterToolsInScaffyConfig(tools: string[], scaffyConf: ConfigSchema): string[] {
  const scaffyToolNames = Object.keys(scaffyConf);
  return extractSubsetFromCollection(tools, scaffyToolNames);
}

async function installTools(scaffyConfObj: ConfigSchema, tools: string[]) {
  const installationPromises = tools.map(toolName => {
    const toolConfigObj = scaffyConfObj[toolName];
    return installIndividualTool(toolName, toolConfigObj);
  });

  return Promise.allSettled(installationPromises);
}

async function installIndividualTool(
  toolName: string,
  toolConfObj: ConfigSchema[string]
) {
  info(`Setting up ${toolName}...`);

  if (isEmpty.obj(toolConfObj)) {
    info(`${toolName} has no configuration, skipping...`);
    return Promise.reject(new Error(`No Configuration for ${toolName}`));
  }

  const projectRootDir = determineRootDirectory();
  const { toolDeps, toolConfigs } = extractToolDepsAndConfigs(toolConfObj);
  const { remoteConfigurations, localConfigurations } = toolConfigs;

  return Promise.allSettled([
    installIndividualToolDeps(toolName, toolDeps),
    download(remoteConfigurations, projectRootDir),
    copyFiles(localConfigurations, projectRootDir),
  ]);
}

type ToolConfigs = Pick<
  ConfigSchema[string],
  'localConfigurations' | 'remoteConfigurations'
>;
type ToolDeps = Pick<ConfigSchema[string], 'deps' | 'devDeps'>;

function extractToolDepsAndConfigs(toolConfObj: ConfigSchema[string]): {
  toolConfigs: ToolConfigs;
  toolDeps: ToolDeps;
} {
  const toolConfigs = pickObjPropsToAnotherObj(toolConfObj, [
    'localConfigurations',
    'remoteConfigurations',
  ]);
  const toolDeps = pickObjPropsToAnotherObj(toolConfObj, ['deps', 'devDeps']);
  return { toolConfigs, toolDeps };
}

async function installIndividualToolDeps(tool: string, toolDeps: ToolDeps) {
  info(`Installing Deps for ${tool}`);
  const { devDeps, deps } = toolDeps;

  return Promise.allSettled([
    installDependencies(deps),
    installDependencies(devDeps, true),
  ]);
}

async function installDependencies(deps: string[] | undefined, devDeps: boolean = false) {
  if (!deps || isEmpty.array(deps)) {
    return handleProcessErr(`No dependencies to install. Skipping...`);
  }

  const devFlag = devDeps ? '-D' : '';
  try {
    return $`npm i ${devFlag} ${deps}`;
  } catch (err) {
    return handleProcessErr(
      `Error occurred installing dependencies for this tool. Skipping`
    );
  }
}

async function copyFiles(paths: string[] | undefined, dest: string) {
  if (!paths || isEmpty.array(paths)) return handleProcessErr('No paths to copy');

  const resolvedFilesPaths = paths.map(filepath => resolveFilePath(filepath, dest));
  try {
    return await $`cp -t ${dest} ${resolvedFilesPaths}`;
  } catch (err) {
    return handleProcessErr('Could not copy files');
  }
}

function handleProcessErr(msg: string) {
  error(msg);
  throw new Error(msg);
}

function resolveFilePath(filepath: string, from: string): string {
  return path.resolve(from, filepath);
}

async function getProjectDependencies(): Promise<ProjectDependencies> {
  const rootDir = determineRootDirectory();
  return parseProjectDependencies(`${rootDir}/package.json`);
}
