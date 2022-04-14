import path from 'path';

import { $ } from 'zx';
import { ConfigEntry, ConfigSchema } from '../compiler/types';
import {
  DepProps,
  determineRootDirectory,
  parseProjectDependencies,
  removeEntityAt,
  updatePackageJsonDeps,
} from '../app/helpers';
import {
  error,
  extractBasenameFromPath,
  extractSetFromCollection,
  info,
  isEmpty,
  normalizeArrForSentence,
} from '../utils';
import {
  DepsMap,
  ToolConfigs,
  CommandTemplate,
  extractScaffyConfigSections,
  aggregateToolDependencies,
  generateDepsObj,
} from './common';

export default async function remove(
  rawToolsSpecified: string[],
  pathToScaffyConfig: string
) {
  const commandTemplateFnWithBootstrapSpecificLogic = CommandTemplate(
    handleRemoveCmdSpecificLogic
  );
  await commandTemplateFnWithBootstrapSpecificLogic(
    pathToScaffyConfig,
    rawToolsSpecified
  );
}

async function handleRemoveCmdSpecificLogic(
  scaffyConfObj: ConfigSchema,
  toolsInScaffyConfig: string[]
) {
  await uninstallToolDeps(toolsInScaffyConfig, scaffyConfObj);
  await deleteToolConfigurations(scaffyConfObj, toolsInScaffyConfig);
}

async function uninstallToolDeps(
  toolsToBootStrap: string[],
  scaffyConfObj: ConfigSchema
) {
  info(
    `Uninstalling dependencies for the following tools: ${normalizeArrForSentence(
      toolsToBootStrap
    )}`
  );

  const fooOne = aggregateToolDependencies(performDepsRemoval);
  await fooOne(toolsToBootStrap, scaffyConfObj);
}

async function performDepsRemoval(depsMap: DepsMap) {
  const depsUninstallFn = determineUninstallationFn(depsMap);

  try {
    await depsUninstallFn();
  } catch (err) {
    error(`Error occurred uninstalling dependencies \n${err}.\nSkipping...`);
  }
}

function determineUninstallationFn(depsMap: DepsMap) {
  const { depNames, devDepNames } = depsMap;
  const allDependencyNames = [...depNames, ...devDepNames];

  const { IS_TEST = false } = process.env;

  if (IS_TEST) return mockUninstallOfDependencies.bind(null, depsMap);
  return uninstallDependencies.bind(null, allDependencyNames);
}

async function uninstallDependencies(depNames: string[]) {
  if (isEmpty.array(depNames)) return error(`No dependencies to remove. Skipping...`);
  await $`npm un ${depNames}`;
}

async function mockUninstallOfDependencies(depsMap: DepsMap) {
  const PACKAGE_JSON_PATH = './package.json';
  const { depNames, devDepNames } = depsMap;

  const filteredProjectDeps = await Promise.all([
    removeToolDepsFromProjectDeps(depNames, 'dependencies', PACKAGE_JSON_PATH),
    removeToolDepsFromProjectDeps(devDepNames, 'devDependencies', PACKAGE_JSON_PATH),
  ]);

  const [filteredDepNames, filteredDevDepNames] = filteredProjectDeps;
  console.log({ filteredDepNames, filteredDevDepNames });

  const filteredDepObj = generateDepsObj(filteredDepNames);
  const filteredDevDepObj = generateDepsObj(filteredDevDepNames);

  // Done sequentially since we are writing to the same file
  await updatePackageJsonDeps(PACKAGE_JSON_PATH, 'dependencies', filteredDepObj);
  await updatePackageJsonDeps(PACKAGE_JSON_PATH, 'devDependencies', filteredDevDepObj);
}

async function removeToolDepsFromProjectDeps(
  toolDepNames: string[],
  depType: DepProps,
  packageJSONPath: string
) {
  const { originalObj: packageJsonObj } = await parseProjectDependencies(packageJSONPath);
  const projectDepNames = Object.keys(packageJsonObj[depType]);

  const projectDepNamesWithoutToolDepNames = extractSetFromCollection(
    projectDepNames,
    toolDepNames,
    true
  );

  return projectDepNamesWithoutToolDepNames;
}

async function deleteToolConfigurations(
  scaffyConfObj: ConfigSchema,
  toolNames: string[]
) {
  info(
    `Removing configuration for the following tools: ${normalizeArrForSentence(
      toolNames
    )}`
  );

  const configDeletionPromises = toolNames.map(toolName => {
    const toolConfigObj = scaffyConfObj[toolName];
    return deleteConfigurationForIndividualEntry(toolName, toolConfigObj);
  });

  await Promise.allSettled(configDeletionPromises);
}

async function deleteConfigurationForIndividualEntry(
  toolName: string,
  toolConfObj: ConfigEntry
) {
  info(`Removing configurations for ${toolName}...`);
  const projectRootDir = determineRootDirectory();

  const { toolConfigs } = extractScaffyConfigSections(toolConfObj);
  const absolutePathsArrToToolConfigs = convertToAbsolutePath(
    toolConfigs,
    projectRootDir
  );

  await deleteConfigs(absolutePathsArrToToolConfigs);
}

export function convertToAbsolutePath(
  mixedPathTypesObj: ToolConfigs,
  from: string
): string[] {
  const { remoteConfigurationUrls, localConfigurationPaths } = mixedPathTypesObj;
  const pathsAndUrls = [...remoteConfigurationUrls, ...localConfigurationPaths];

  const filenames = pathsAndUrls.map(extractBasenameFromPath);
  const absolutePaths = filenames.map(filename =>
    determineFileAbsolutePath(from, filename)
  );

  return absolutePaths;
}

function determineFileAbsolutePath(from: string, to: string) {
  return path.resolve(from, to);
}

async function deleteConfigs(allToolConfigurationAbsolutePaths: string[]) {
  const configDeletionPromises = allToolConfigurationAbsolutePaths.map(
    configAbsolutePath => {
      const filename = extractBasenameFromPath(configAbsolutePath);
      const configDeletionPromise = removeEntityAt(configAbsolutePath, filename);
      return configDeletionPromise;
    }
  );

  await Promise.allSettled(configDeletionPromises);
}
