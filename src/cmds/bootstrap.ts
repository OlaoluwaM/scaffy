import path from 'path';
import download from '../app/downloadFile';

import parseScaffyConfig from '../app/parseConfig';

import { $ } from 'zx';
import { ConfigEntry, ConfigSchema } from '../compiler/types';
import { determineRootDirectory, genericErrorHandler } from '../app/helpers';
import {
  info,
  error,
  isEmpty,
  success,
  normalizeArrForSentence,
  pickObjPropsToAnotherObj,
  extractSubsetFromCollection,
} from '../utils';

export default async function bootstrap(
  pathToScaffyConfig: string,
  toolsSpecified: string[]
) {
  const scaffyConfObj = await parseScaffyConfig(pathToScaffyConfig);
  const toolsInScaffyConfig = filterToolsAvailableInScaffyConfig(
    toolsSpecified,
    scaffyConfObj
  );
  if (isEmpty.array(toolsInScaffyConfig)) {
    genericErrorHandler(
      'Seems like non of those tools were specified in your scaffy config',
      false
    );
  }

  await installAllToolDeps(toolsInScaffyConfig, scaffyConfObj);
  await retrieveToolConfigurations(scaffyConfObj, toolsInScaffyConfig);
}

function filterToolsAvailableInScaffyConfig(
  tools: string[],
  scaffyConf: ConfigSchema
): string[] {
  const scaffyToolNames = Object.keys(scaffyConf);
  return extractSubsetFromCollection(tools, scaffyToolNames);
}

async function installAllToolDeps(
  toolsToBootStrap: string[],
  scaffyConfObj: ConfigSchema
) {
  info(
    `Installing dependencies for the following tools: ${normalizeArrForSentence(
      toolsToBootStrap
    )}`
  );

  const aggregateDependenciesToBeInstalled = aggregateDepTypeForDesiredTools(
    toolsToBootStrap,
    scaffyConfObj,
    'deps'
  );

  const aggregateDevDependenciesToBeInstalled = aggregateDepTypeForDesiredTools(
    toolsToBootStrap,
    scaffyConfObj,
    'devDeps'
  );

  await installDependencies(aggregateDependenciesToBeInstalled);
  await installDependencies(aggregateDevDependenciesToBeInstalled, true);

  success('Dependencies and DevDependencies installed successfully!');
}

type DependencyTypes = Extract<keyof ConfigEntry, 'deps' | 'devDeps'>;
function aggregateDepTypeForDesiredTools(
  tools: string[],
  scaffyConfObj: ConfigSchema,
  dependencyTypeToAggregate: DependencyTypes
): string[] {
  const deps = tools
    .flatMap(toolName => {
      const targetDependencies = scaffyConfObj[toolName][dependencyTypeToAggregate];
      if (isEmpty.array(targetDependencies)) return null;

      return targetDependencies;
    })
    .filter(Boolean) as string[];

  return deps;
}

async function installDependencies(deps: string[], devDeps: boolean = false) {
  if (isEmpty.array(deps)) {
    return error(`No dependencies to install. Skipping...`);
  }

  const devFlag = devDeps ? '-D' : '';
  try {
    return await $`npm i ${devFlag} ${deps}`;
  } catch (err) {
    return error(`Error occurred installing dependencies \n${err}.\nSkipping...`);
  }
}

async function retrieveToolConfigurations(scaffyConfObj: ConfigSchema, tools: string[]) {
  const retrievalPromises = tools.map(toolName => {
    const toolConfigObj = scaffyConfObj[toolName];
    return retrieveIndividualConfigs(toolName, toolConfigObj);
  });

  return Promise.allSettled(retrievalPromises);
}

async function retrieveIndividualConfigs(toolName: string, toolConfObj: ConfigEntry) {
  info(`Retrieving configurations for ${toolName}...`);

  const projectRootDir = determineRootDirectory();

  const { toolConfigs } = extractScaffyConfigSections(toolConfObj);
  const { remoteConfigurations, localConfigurations } = toolConfigs;

  const installationResults = Promise.allSettled([
    download(remoteConfigurations, projectRootDir),
    copyFiles(localConfigurations, projectRootDir),
  ]);

  return installationResults;
}

type ToolConfigs = Pick<ConfigEntry, 'localConfigurations' | 'remoteConfigurations'>;
type ToolDeps = Pick<ConfigEntry, 'deps' | 'devDeps'>;

function extractScaffyConfigSections(toolConfObj: ConfigEntry): {
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

async function copyFiles(paths: string[], dest: string) {
  if (isEmpty.array(paths)) return handleProcessErr('No paths to copy');

  const resolvedFilesPaths = paths.map(filepath => resolveFilePath(filepath, dest));
  try {
    info('Copying files....');
    const result = await $`cp -t ${dest} ${resolvedFilesPaths}`;
    success('Files copied successfully');

    return result;
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
