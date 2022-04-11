import path from 'path';
import download from '../app/downloadFile';
import parseScaffyConfig from '../app/parseConfig';

import { $ } from 'zx';
import { ConfigEntry, ConfigSchema, Dependencies } from '../compiler/types';
import {
  DepProps,
  genericErrorHandler,
  updatePackageJsonDeps,
  determineRootDirectory,
} from '../app/helpers';
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
  rawToolsSpecified: string[]
) {
  const scaffyConfObj = await parseScaffyConfig(pathToScaffyConfig);
  const toolsInScaffyConfig = filterToolsAvailableInScaffyConfig(
    rawToolsSpecified,
    scaffyConfObj
  );

  exitIfThereAreNoToolsToBootstrap(toolsInScaffyConfig);

  await installAllToolDeps(toolsInScaffyConfig, scaffyConfObj);
  await retrieveToolConfigurations(scaffyConfObj, toolsInScaffyConfig);
}

function exitIfThereAreNoToolsToBootstrap(toolsInScaffyConfig: string[]) {
  if (!isEmpty.array(toolsInScaffyConfig)) return;
  genericErrorHandler(
    'Seems like non of those tools were specified in your scaffy config',
    false
  );
}

function filterToolsAvailableInScaffyConfig(
  rawPassedInTools: string[],
  scaffyConf: ConfigSchema
): string[] {
  const scaffyToolNames = Object.keys(scaffyConf);
  return extractSubsetFromCollection(rawPassedInTools, scaffyToolNames);
}

interface DepsMap {
  depNames: string[];
  devDepNames: string[];
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
    'depNames'
  );

  const aggregateDevDependenciesToBeInstalled = aggregateDepTypeForDesiredTools(
    toolsToBootStrap,
    scaffyConfObj,
    'devDepNames'
  );

  const depsMap: DepsMap = {
    depNames: aggregateDependenciesToBeInstalled,
    devDepNames: aggregateDevDependenciesToBeInstalled,
  };

  await performDepsInstallation(depsMap);
}

type DependencyTypes = Extract<keyof ConfigEntry, 'depNames' | 'devDepNames'>;
function aggregateDepTypeForDesiredTools(
  tools: string[],
  scaffyConfObj: ConfigSchema,
  dependencyTypeToAggregate: DependencyTypes
) {
  const aggregateDeps = tools.flatMap(toolName => {
    const toolNameConfigEntry = scaffyConfObj[toolName];
    const targetDependencies = toolNameConfigEntry[dependencyTypeToAggregate];
    return targetDependencies;
  });

  return aggregateDeps;
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
      return error(`Error occurred installing dev dependencies \n${err}.\nSkipping...`);
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

  const depObj = toDepObj(dependenciesThatExistInRegistry);
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

function toDepObj(depsArr: string[]): Dependencies {
  const DEFAULT_DEP_VERSION = '*' as const;
  type DepEntry = [string, typeof DEFAULT_DEP_VERSION];

  const depObjEntries: DepEntry[] = depsArr.map(depName => [
    depName,
    DEFAULT_DEP_VERSION,
  ]);

  const depObj: Dependencies = Object.fromEntries(depObjEntries);
  return depObj;
}

async function installDependencies(depNames: string[], npmInstallFlags: string[] = []) {
  if (isEmpty.array(depNames)) return error(`No dependencies to install. Skipping...`);
  await $`npm i ${npmInstallFlags} ${depNames}`;
}

async function retrieveToolConfigurations(scaffyConfObj: ConfigSchema, tools: string[]) {
  const retrievalPromises = tools.map(toolName => {
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

type ToolConfigs = Pick<
  ConfigEntry,
  'localConfigurationPaths' | 'remoteConfigurationUrls'
>;
type ToolDeps = Pick<ConfigEntry, 'depNames' | 'devDepNames'>;

function extractScaffyConfigSections(toolConfObj: ConfigEntry): {
  toolConfigs: ToolConfigs;
  toolDeps: ToolDeps;
} {
  const toolConfigs = pickObjPropsToAnotherObj(toolConfObj, [
    'localConfigurationPaths',
    'remoteConfigurationUrls',
  ]);
  const toolDeps = pickObjPropsToAnotherObj(toolConfObj, ['depNames', 'devDepNames']);
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
