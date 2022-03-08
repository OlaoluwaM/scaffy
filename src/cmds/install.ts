#!/usr/bin/env zx
/* global $ */

import 'zx/globals';

import {
  doesObjectHaveProperty,
  error,
  extractSubsetFromCollection,
  info,
  isEmptyObject,
  pickObjPropsToAnotherObj,
} from '../utils';
import {
  determineRootDirectory,
  parseScaffyConfig,
  retrieveProjectDependencies,
} from '../lib/helpers';

import type { ConfigSchema, ProjectDependencies } from '../compiler/types';

export default async function install(pathToScaffyConfig: string, tools: string[]) {
  const scaffyConfObj = await parseScaffyConfig(pathToScaffyConfig);
  const projectDependencies = await parseProjectDependencies();
  const toolsInScaffyConfig = filterToolsInScaffyConfig(tools, scaffyConfObj);
  // await Promise.allSettled(installationPromises);
}

async function parseProjectDependencies(): Promise<ProjectDependencies> {
  const rootDir = determineRootDirectory();
  return retrieveProjectDependencies(`${rootDir}/package.json`);
}

function filterToolsInScaffyConfig(tools: string[], scaffyConf: ConfigSchema): string[] {
  const scaffyToolNames = Object.keys(scaffyConf);
  return extractSubsetFromCollection(tools, scaffyToolNames);
}

async function installTool(scaffyConfObj: ConfigSchema, tools: string[]) {
  const installationPromises = tools.flatMap(toolName => {
    const toolConfigObj = scaffyConfObj[toolName];

    if (isEmptyObject(toolConfigObj)) {
      info(`${toolName} has no configuration`);
      return [Promise.resolve('No Configuration')]
    }

    const { toolDeps, toolConfigs } = extractToolDepsAndConfigs(toolConfigObj);

    return [installIndividualTool(toolName, toolDeps), downloadConfigs()];
  });
  return installationPromises;
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

async function installIndividualTool(tool: string, toolConfigObj?: ConfigSchema[string]) {
  if (!toolConfigObj) exitOnUnavailableTool(tool);
  const { devDeps, deps } = toolConfigObj;

  return Promise.allSettled([
    installDependencies(deps),
    installDependencies(devDeps, true),
  ]);
}

function exitOnUnavailableTool(toolName: string): never {
  error(`No configuration found for ${toolName} in scaffy config`);
  throw new Error('No config for tool');
}

async function installDependencies(deps?: string[], devDeps: boolean = false) {
  if (!deps || deps.length === 0) return handleInstallDependenciesError();
  const devFlag = devDeps ? '-D' : '';
  return $`npm i ${devFlag} ${deps}`;
}
function handleInstallDependenciesError() {
  info(`No dependencies to install`);
}

// async function setupCustomTool(nameOfTool, shouldRemove = false) {
//   info(`Setting up ${nameOfTool}`)
//   const toolInstallationReq = await grabReqsFromConfig(nameOfTool);

//   // These can be done in parallel
//   await installDependencies(toolInstallationReq, shouldRemove);
//   await installDevDependencies(toolInstallationReq, shouldRemove);
//   await downloadRemoteConfigs(toolInstallationReq, shouldRemove);
//   await copyLocalConfigs(toolInstallationReq, shouldRemove);

//   success('name of tool has been successfully installed \n');
// }

function isToolListedInConfig(toolName: string, scaffyConfObj: ConfigSchema): boolean {
  return doesObjectHaveProperty(scaffyConfObj, toolName);
}
