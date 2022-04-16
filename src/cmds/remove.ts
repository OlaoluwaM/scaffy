import path from 'path';

import { $ } from 'zx';
import { ConfigEntry, ConfigSchema } from '../compiler/types';
import {
  DepProps,
  removeEntityAt,
  updatePackageJsonDeps,
  determineRootDirectory,
  parseProjectDependencies,
  removeVersionInfoFromDepNames,
} from '../app/helpers';
import {
  error,
  isEmpty,
  AsyncProcessSpinner,
  extractBasenameFromPath,
  extractSetFromCollection,
} from '../utils';
import {
  DepsMap,
  ToolConfigs,
  CommandTemplate,
  generateDepsObj,
  aggregateToolDependencies,
  extractScaffyConfigSections,
} from './common';

export default async function remove(
  pathToScaffyConfig: string,
  rawToolsSpecified: string[]
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
  toolsInScaffyConfig: string[],
  toolListStr: string
) {
  const uninstallToolDepsWithSpinner = new AsyncProcessSpinner(
    uninstallToolDeps(toolsInScaffyConfig, scaffyConfObj),
    {
      initialText: `Removing regular and dev dependencies for ${toolListStr}\n`,
      onSuccessText: ` All dependencies for ${toolListStr} have been removed!`,
      onFailText: ` Error occurred while removing some dependencies for ${toolListStr}`,
    }
  );

  await uninstallToolDepsWithSpinner.startAsyncSpinnerWithPromise();

  const deleteToolConfigsWithSpinner = new AsyncProcessSpinner(
    deleteToolConfigurations(scaffyConfObj, toolsInScaffyConfig),
    {
      initialText: `Removing config files for ${toolListStr}\n`,
      onSuccessText: ` All config files for ${toolListStr} have been removed!`,
      onFailText: ` Error occurred while removing some config files for ${toolListStr}`,
    }
  );

  await deleteToolConfigsWithSpinner.startAsyncSpinnerWithPromise();
}

async function uninstallToolDeps(
  toolsToBootStrap: string[],
  scaffyConfObj: ConfigSchema
) {
  const unInstallAggregateToolDeps = aggregateToolDependencies(performDepsRemoval);
  await unInstallAggregateToolDeps(toolsToBootStrap, scaffyConfObj);
}

async function performDepsRemoval(depsMap: DepsMap) {
  const depsUninstallFn = determineUninstallationFnToUse(depsMap);

  try {
    await depsUninstallFn();
  } catch (err) {
    error(`Error occurred uninstalling dependencies \n${err}.\nSkipping...`);
  }
}

function determineUninstallationFnToUse(depsMap: DepsMap) {
  const { depNames, devDepNames } = depsMap;
  const allDependencyNames = [...depNames, ...devDepNames];

  const { IS_TEST = false } = process.env;

  if (IS_TEST) return mockUninstallOfDependencies.bind(null, depsMap);
  return uninstallDependencies.bind(null, allDependencyNames);
}

async function uninstallDependencies(depNames: string[]) {
  if (isEmpty.array(depNames)) return;
  const depNamesWithoutVersionInfo = removeVersionInfoFromDepNames(depNames);

  await $`npm un ${depNamesWithoutVersionInfo}`;
}

async function mockUninstallOfDependencies(depsMap: DepsMap) {
  const PACKAGE_JSON_PATH = './package.json';

  const depNames = removeVersionInfoFromDepNames(depsMap.depNames);
  const devDepNames = removeVersionInfoFromDepNames(depsMap.devDepNames);

  const filteredProjectDeps = await Promise.all([
    removeToolDepsFromProjectDeps(depNames, 'dependencies', PACKAGE_JSON_PATH),
    removeToolDepsFromProjectDeps(devDepNames, 'devDependencies', PACKAGE_JSON_PATH),
  ]);

  const [filteredDepNames, filteredDevDepNames] = filteredProjectDeps;

  const filteredDepObj = generateDepsObj(filteredDepNames);
  const filteredDevDepObj = generateDepsObj(filteredDevDepNames);

  // NOTE: Done sequentially since we are writing to the same file
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
  const configDeletionPromises = toolNames.map(toolName => {
    const toolConfigObj = scaffyConfObj[toolName];
    return deleteConfigurationForIndividualEntry(toolConfigObj);
  });

  await Promise.allSettled(configDeletionPromises);
}

async function deleteConfigurationForIndividualEntry(toolConfObj: ConfigEntry) {
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
