import path from 'path';
import download from '../app/downloadFile';
import parseScaffyConfig from '../app/parseConfig';

import { $ } from 'zx';
import { ConfigEntry, ConfigSchema, Dependencies } from '../compiler/types';
import {
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
  rawPassedInTools: string[],
  scaffyConf: ConfigSchema
): string[] {
  const scaffyToolNames = Object.keys(scaffyConf);
  return extractSubsetFromCollection(rawPassedInTools, scaffyToolNames);
}

interface DepsMap {
  deps: string[];
  devDeps: string[];
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

  const depsMap: DepsMap = {
    deps: aggregateDependenciesToBeInstalled,
    devDeps: aggregateDevDependenciesToBeInstalled,
  };

  await mockToolInstallationIfNecessary(depsMap);
}

type DependencyTypes = Extract<keyof ConfigEntry, 'deps' | 'devDeps'>;

function aggregateDepTypeForDesiredTools<DependencyType extends DependencyTypes>(
  tools: string[],
  scaffyConfObj: ConfigSchema,
  dependencyTypeToAggregate: DependencyType
) {
  type ResultingDepArr = ConfigSchema[string][DependencyType];

  const aggregateDeps = tools.flatMap(toolName => {
    const toolNameConfigEntry = scaffyConfObj[toolName];
    const targetDependencies = toolNameConfigEntry[dependencyTypeToAggregate];
    return targetDependencies;
  });

  return aggregateDeps as ResultingDepArr;
}

async function mockToolInstallationIfNecessary(depsMap: DepsMap) {
  const { IS_TEST = false } = process.env;

  if (!IS_TEST) {
    await performDepsInstallation(depsMap);
  } else {
    await performMockDepsInstallation(depsMap);
  }
}

async function performDepsInstallation(depsMap: DepsMap, installFlags: string[] = []) {
  const { deps, devDeps } = depsMap;

  const DEV_DEP_INSTALL_FLAG = '-D' as const;
  const devDepFlags = installFlags.concat(DEV_DEP_INSTALL_FLAG);

  // NOTE: This is done sequentially because npm installs cannot be executed in parallel
  try {
    await installDependencies(deps, installFlags);
  } catch (err) {
    error(`Error occurred installing dependencies \n${err}.\nSkipping...`);
  }

  try {
    await installDependencies(devDeps, devDepFlags);
  } catch (err) {
    return error(`Error occurred installing dev dependencies \n${err}.\nSkipping...`);
  }

  return success('Dependencies and DevDependencies installed!');
}

async function performMockDepsInstallation(depsMap: DepsMap) {
  const PACKAGE_JSON_PATH = resolveFilePath('package.json', '.');
  const { deps, devDeps } = depsMap;

  try {
    const depsObj = await generateDependencyObj(deps);
    await updatePackageJsonDeps(PACKAGE_JSON_PATH, 'dependencies', depsObj);
  } catch (err) {
    error(`Error occurred installing dependencies \n${err}.\nSkipping...`);
  }

  try {
    const devDepsObj = await generateDependencyObj(devDeps);
    await updatePackageJsonDeps(PACKAGE_JSON_PATH, 'devDependencies', devDepsObj);
  } catch (err) {
    error(`Error occurred installing dev dependencies \n${err}.\nSkipping...`);
  }
}

async function generateDependencyObj(deps: string[]): Promise<Dependencies> {
  const dependencySearchPromises = deps.map(doesPkgExistInNPMRegistry);
  const results = await Promise.all(dependencySearchPromises);

  const dependenciesThatExistInRegistry = results
    .map((doesPkgExist, ind) => (doesPkgExist ? deps[ind] : false))
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

async function installDependencies(deps: string[], npmInstallFlags: string[] = []) {
  if (isEmpty.array(deps)) return error(`No dependencies to install. Skipping...`);

  const outputData = await $`npm i ${npmInstallFlags} ${deps}`;
  return outputData;
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
