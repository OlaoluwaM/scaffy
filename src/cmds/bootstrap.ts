import path from 'path';
import download from '../app/downloadFile';

import { $ } from 'zx';
import {
  DepsMap,
  CommandTemplate,
  aggregateToolDependencies,
  extractScaffyConfigSections,
  generateDepsObj,
} from './common';
import { info, error, isEmpty, success, normalizeArrForSentence } from '../utils';
import { ConfigEntry, ConfigSchema, Dependencies } from '../compiler/types';
import { DepProps, updatePackageJsonDeps, determineRootDirectory } from '../app/helpers';

export default async function bootstrap(
  pathToScaffyConfig: string,
  rawToolsSpecified: string[]
) {
  const commandTemplateFnWithBootstrapSpecificLogic = CommandTemplate(
    handleBootstrapCmdSpecificLogic
  );
  await commandTemplateFnWithBootstrapSpecificLogic(
    pathToScaffyConfig,
    rawToolsSpecified
  );
}

async function handleBootstrapCmdSpecificLogic(
  scaffyConfObj: ConfigSchema,
  toolsInScaffyConfig: string[]
) {
  await installAllToolDeps(toolsInScaffyConfig, scaffyConfObj);
  await retrieveToolConfigurations(scaffyConfObj, toolsInScaffyConfig);
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

  const fooOne = aggregateToolDependencies(performDepsInstallation);
  await fooOne(toolsToBootStrap, scaffyConfObj);
}

async function performDepsInstallation(depsMap: DepsMap, installFlags: string[] = []) {
  const { depsInstallFunc, devDepsInstallFunc } = provideMockInstallFunctionsIfNecessary(
    depsMap,
    installFlags
  );

  const installFuncForAllDeps = installationTemplate(depsInstallFunc, devDepsInstallFunc);
  await installFuncForAllDeps();

  return success('Dependencies and DevDependencies installed!');
}

type InstallationFn = () => Promise<void>;
interface InstallationFunctionMap {
  depsInstallFunc: InstallationFn;
  devDepsInstallFunc: InstallationFn;
}

function provideMockInstallFunctionsIfNecessary(
  depsMap: DepsMap,
  installFlags: string[]
): InstallationFunctionMap {
  const { IS_TEST } = process.env;
  const { depNames, devDepNames } = depsMap;

  const DEV_DEP_INSTALL_FLAG = '-D' as const;
  const devDepFlags = installFlags.concat(DEV_DEP_INSTALL_FLAG);

  let depsInstallFunc;
  let devDepsInstallFunc;

  if (IS_TEST) {
    depsInstallFunc = mockDepsInstallation.bind(null, depNames, 'dependencies');
    devDepsInstallFunc = mockDepsInstallation.bind(null, devDepNames, 'devDependencies');
  } else {
    depsInstallFunc = installDependencies.bind(null, depNames, installFlags);
    devDepsInstallFunc = installDependencies.bind(null, devDepNames, devDepFlags);
  }

  return { depsInstallFunc, devDepsInstallFunc };
}

function installationTemplate(
  depsInstallationCB: InstallationFn,
  devDepsInstallationCB: InstallationFn
) {
  return async () => {
    // NOTE: This is done sequentially because npm installs cannot be executed in parallel

    try {
      await depsInstallationCB();
    } catch (err) {
      error(`Error occurred installing dependencies \n${err}.\nSkipping...`);
    }

    try {
      await devDepsInstallationCB();
    } catch (err) {
      error(`Error occurred installing dev dependencies \n${err}.\nSkipping...`);
    }
  };
}

async function mockDepsInstallation(depNames: string[], depType: DepProps) {
  const depObj = await generateDependencyObj(depNames);
  const PACKAGE_JSON_PATH = resolveFilePath('package.json', '.');

  await updatePackageJsonDeps(PACKAGE_JSON_PATH, depType, depObj);
}

async function generateDependencyObj(depNames: string[]): Promise<Dependencies> {
  const dependencySearchPromises = depNames.map(doesPkgExistInNPMRegistry);
  const results = await Promise.all(dependencySearchPromises);

  const dependenciesThatExistInRegistry = results
    .map((doesPkgExist, ind) => (doesPkgExist ? depNames[ind] : false))
    .filter(Boolean) as string[];

  const depObj = generateDepsObj(dependenciesThatExistInRegistry);
  return depObj;
}

async function doesPkgExistInNPMRegistry(pkgName: string): Promise<boolean> {
  if (isEmpty.string(pkgName)) return false;

  try {
    await $` npm search --no-description "${pkgName}" | awk '{print $1}' | grep -wm 1 "${pkgName}"`;
    return true;
  } catch {
    return false;
  }
}

async function installDependencies(depNames: string[], npmInstallFlags: string[] = []) {
  if (isEmpty.array(depNames)) return error(`No dependencies to install. Skipping...`);
  await $`npm i ${npmInstallFlags} ${depNames}`;
}

async function retrieveToolConfigurations(
  scaffyConfObj: ConfigSchema,
  toolNames: string[]
) {
  const retrievalPromises = toolNames.map(toolName => {
    const toolConfigObj = scaffyConfObj[toolName];
    return retrieveIndividualConfigs(toolName, toolConfigObj);
  });

  await Promise.allSettled(retrievalPromises);
}

async function retrieveIndividualConfigs(toolName: string, toolConfObj: ConfigEntry) {
  info(`Retrieving configurations for ${toolName}...`);

  const projectRootDir = determineRootDirectory();

  const { toolConfigs } = extractScaffyConfigSections(toolConfObj);
  const { remoteConfigurationUrls, localConfigurationPaths } = toolConfigs;

  const installationResults = Promise.allSettled([
    download(remoteConfigurationUrls, projectRootDir),
    copyFiles(localConfigurationPaths, projectRootDir),
  ]);

  return installationResults;
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
