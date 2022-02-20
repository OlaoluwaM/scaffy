#!/usr/bin/env zx
/* global $ */

import 'zx/globals';

import { doesObjectHaveProperty, error, info } from '../../utils';
import { parseScaffyConfig, retrieveProjectDependencies } from '../../helpers';
import { projectRootDir } from '../../constants';

import type { ConfigSchema, ProjectDependencies } from '../../compiler/types';

export default async function install(tools: string[]) {
  const scaffyConf = await parseScaffyConfig(`${projectRootDir}/scaffy.config`);
  const projectDependencies = await retrieveProjectDependencies(
    `${projectRootDir}/package.json`
  );

  // await performScaffyDepChecks()

  // const installationPromises = tools.map(tool =>
  //   installIndividualTool(tool, scaffyConf?.[tool], projectDependencies)
  // );

  // await Promise.allSettled(installationPromises);
}

// async function installIndividualTool(
//   tool: string,
//   toolReqs: ConfigSchema[string] | undefined,
//   projectDeps: ProjectDependencies
// ): Promise<void> | never {
//   if (!toolReqs) return exitOnUnavailableTool(tool);
//   const { devDeps, deps, remoteConfigurations, localConfigurations } = toolReqs;

//   await Promise.allSettled([
//     installDependencies(deps),
//     installDependencies(devDeps, true),
//   ]);
//   return
// }

function exitOnUnavailableTool(toolName: string): never {
  error(`${toolName} is not listed in scaffy configuration`);
  return process.exit(1);
}

async function installDependencies(toolDeps: string[], devDeps: boolean = false) {
  const devFlag = devDeps ? '-D' : '';
  await $`npm i ${devFlag} ${toolDeps}`;
}

async function downloadRemoteConfigs(remoteConfigs: string[]) {
  await $`curl -LJ --remote-name-all ${remoteConfigs} `;
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
