import parseScaffyConfig from '../src/app/parseConfig';

import { didAllPromisesSucceed } from './helpers';
import { isSubset, pickObjPropsToAnotherObj, valueIs } from '../src/utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect, beforeAll } from '@jest/globals';
import { ConfigEntry, ConfigSchema } from '../src/compiler/types';
import { default as remove, convertToAbsolutePath } from '../src/cmds/remove';
import {
  doesPathExist,
  removeVersionInfoFromDepNames,
  parseProjectDependencies,
  ProjectDependencies,
} from '../src/app/helpers';

enum PathTo {
  TESTING_DIR = './for-remove-cmd',
  SCAFFY_CONFIG = './sample.scaffy.json',
  PACKAGE_JSON = './package.json',
}

let toolNamesInConfig: string[];
let sampleScaffyConfigObj: ConfigSchema;

beforeAll(async () => {
  process.chdir(PathTo.TESTING_DIR);

  sampleScaffyConfigObj = await parseScaffyConfig(PathTo.SCAFFY_CONFIG);
  toolNamesInConfig = Object.keys(sampleScaffyConfigObj);
});

async function generateRemovalResultBooleanVectorFromToolNameArr(
  toolNames: string[]
): Promise<boolean[]> {
  const removalResultBooleanVectorPromises = toolNames.map(hasToolBeenUninstalled);
  const removalResultBooleanVectorPromiseResults = await Promise.all(
    removalResultBooleanVectorPromises
  );

  return removalResultBooleanVectorPromiseResults;
}

async function hasToolBeenUninstalled(toolName: string): Promise<boolean> {
  const toolEntry = sampleScaffyConfigObj[toolName];
  const projectDependencies = await parseProjectDependencies(PathTo.PACKAGE_JSON);

  const depsAreUninstalled = haveToolDepsBeenUninstalled(toolEntry, projectDependencies);
  const toolConfigsHaveBeenDeleted = await haveToolConfigsBeenDeleted(toolEntry);

  return depsAreUninstalled && toolConfigsHaveBeenDeleted;
}

function haveToolDepsBeenUninstalled(
  toolEntry: ConfigEntry,
  projectDependencies: ProjectDependencies
): boolean {
  const { depNames: toolEntryDepNames, devDepNames: toolEntryDevDepNames } = toolEntry;

  const projectDepNames = Object.keys(projectDependencies.dependencies);
  const projectDevDepNames = Object.keys(projectDependencies.devDependencies);

  const EDGE_CASES = ['', 'typescript@latest', 'latest@latest'];

  const areToolDepsNoLongeSubsetOfProjectDeps = !isSubset(
    projectDepNames.concat(EDGE_CASES),
    removeVersionInfoFromDepNames(toolEntryDepNames)
  );

  const areToolDevDepsNoLongeSubsetOfProjectDevDeps = !isSubset(
    projectDevDepNames.concat(EDGE_CASES),
    removeVersionInfoFromDepNames(toolEntryDevDepNames)
  );

  return (
    areToolDepsNoLongeSubsetOfProjectDeps && areToolDevDepsNoLongeSubsetOfProjectDevDeps
  );
}

async function haveToolConfigsBeenDeleted(toolEntry: ConfigEntry): Promise<boolean> {
  const toolConfigs = pickObjPropsToAnotherObj(toolEntry, [
    'remoteConfigurationUrls',
    'localConfigurationPaths',
  ]);

  const absolutePathsArrToToolConfigs = convertToAbsolutePath(
    toolConfigs,
    PathTo.TESTING_DIR
  );

  const pathExistencePromises = absolutePathsArrToToolConfigs.map(doesPathExist);
  const pathExistencePromiseResult = await Promise.allSettled(pathExistencePromises);
  return didAllPromisesSucceed(pathExistencePromiseResult);
}

test('Should make sure remove command deletes tool dependencies and configs', async () => {
  // Arrange
  const toolsToSetup = ['zod', 'jest'].concat(toolNamesInConfig);

  // Act
  await remove(PathTo.SCAFFY_CONFIG, toolsToSetup);
  const toolRemovalBooleanMap = await generateRemovalResultBooleanVectorFromToolNameArr(
    toolNamesInConfig
  );

  const haveAllToolsBeenUninstalled = toolRemovalBooleanMap.every(valueIs.true);

  // Assert
  expect(haveAllToolsBeenUninstalled).toBe(true);
}, 400000);
