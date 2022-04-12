/* eslint-disable no-restricted-syntax */
import bootstrap from '../src/cmds/bootstrap';
import parseScaffyConfig from '../src/app/parseConfig';

import { ExitCodes } from '../src/constants';
import { parseProjectDependencies } from '../src/app/helpers';
import { ConfigEntry, ConfigSchema } from '../src/compiler/types';
// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect, beforeAll, jest } from '@jest/globals';
import { doAllFilesExist, isSuccessfulPromise, didAllPromisesSucceed } from './helpers';
import {
  isEmpty,
  isSubset,
  extractBasenameFromPath,
  pickObjPropsToAnotherObj,
} from '../src/utils';

const pathToScaffyConfig = `./sample.scaffy.json`;

let toolNamesInConfig: string[];
let sampleScaffyConfig: ConfigSchema;

beforeAll(async () => {
  console.log({ t: process.cwd() });
  const testingDir = `./for-bootstrap-cmd`;
  process.chdir(testingDir);

  sampleScaffyConfig = await parseScaffyConfig(pathToScaffyConfig);
  toolNamesInConfig = Object.keys(sampleScaffyConfig);
});

type InstallationStatuses = 'toolDepsInstalled' | 'configsRetrieved';
type MappedToolBootstrapResultMembers = {
  [Status in InstallationStatuses]: boolean;
};
interface OtherToolBootstrapResultMembers {
  name?: string;
}

type ToolBootstrapResult = MappedToolBootstrapResultMembers &
  OtherToolBootstrapResultMembers;

async function computeToolBootstrapResults(
  toolConfigObj: ConfigEntry,
  toolName: string = 'tool'
): Promise<ToolBootstrapResult> {
  const projectDependencies = await parseProjectDependencies(`./package.json`);

  const allPackageJsonDeps = [
    ...Object.keys(projectDependencies.dependencies),
    ...Object.keys(projectDependencies.devDependencies),
  ];

  const { depNames, devDepNames, remoteConfigurationUrls, localConfigurationPaths } =
    toolConfigObj;
  const allToolDeps = [...depNames, ...devDepNames];
  const allToolConfigs = [...localConfigurationPaths, ...remoteConfigurationUrls].map(
    extractBasenameFromPath
  );

  const installationResults: ToolBootstrapResult = {
    name: toolName,
    toolDepsInstalled: wereToolDepsInstalled(allPackageJsonDeps, allToolDeps),
    configsRetrieved: await areToolConfigFilesAvailableInProjectDir(allToolConfigs),
  };

  return installationResults;
}

function wereToolDepsInstalled(projectDeps: string[], toolDeps: string[]): boolean {
  if (isEmpty.array(toolDeps)) return true;
  return isSubset(projectDeps, toolDeps);
}

async function areToolConfigFilesAvailableInProjectDir(
  fileArr: string[]
): Promise<boolean> {
  if (isEmpty.array(fileArr)) return true;

  const fileLocationPromisesResult = await doAllFilesExist(fileArr, '.');
  return didAllPromisesSucceed(fileLocationPromisesResult);
}

function bootstrapWasSuccessful(bootstrapResults: ToolBootstrapResult): boolean {
  const bootstrapResultsWithoutName = pickObjPropsToAnotherObj(
    bootstrapResults,
    ['name'],
    true
  );
  const installationStatuses = Object.values(bootstrapResultsWithoutName);
  return installationStatuses.every(bool => bool === true);
}

test('Should make sure bootstrap command installs depNames and retrieves files as required for a single tool scaffolding (bootstrapping)', async () => {
  // Arrange
  const sampleToolsArg = [toolNamesInConfig[0], 'sfsfsd', 'svwrefrw', 'fewfwe'];
  const testSubjectToolCOnfig = sampleScaffyConfig[sampleToolsArg[0]] as ConfigEntry;

  // Act
  await bootstrap(pathToScaffyConfig, sampleToolsArg);

  const wasToolBootStrapASuccess = bootstrapWasSuccessful(
    await computeToolBootstrapResults(testSubjectToolCOnfig)
  );

  // Assert
  expect(wasToolBootStrapASuccess).toBe(true);
});

const testCases: [string, number, number | undefined][] = [
  ['successfully if configs are valid', 1, 4],
  ["even with some undefined/omitted config options'", 4, 7],
  ["even with some invalid config options'", 7, undefined],
];

test.each(testCases)(
  'Should ensure that multiple tools can be bootstrapped %s',
  async (_, startIndex, endIndex) => {
    // Arrange
    const sampleToolsArg = toolNamesInConfig.slice(startIndex, endIndex);

    // Act
    await bootstrap(pathToScaffyConfig, sampleToolsArg);

    // Assert
    const bootstrapResultPromises = sampleToolsArg.map(toolName => {
      const toolConfig = sampleScaffyConfig[toolName];
      return computeToolBootstrapResults(toolConfig, toolName);
    });

    const bootstrapPromiseResults = await Promise.allSettled(bootstrapResultPromises);

    const toolBootstrapResultsBooleanArr = bootstrapPromiseResults.map(promiseResult =>
      isSuccessfulPromise(promiseResult)
    );

    const allBootstrapAttemptsWereSuccessful = toolBootstrapResultsBooleanArr.every(
      booleanResult => booleanResult === true
    );

    expect(allBootstrapAttemptsWereSuccessful).toBe(true);
  },
  90000
);

test('That bootstrap command errors if tools specified as args are not present in scaffy config', async () => {
  // Arrange
  const sampleToolsArg: string[] = [];

  // Act
  const mockedProcessExit = jest
    .spyOn(process, 'exit')
    .mockImplementationOnce(() => true as never);

  await bootstrap(pathToScaffyConfig, sampleToolsArg);

  // Assert
  expect(mockedProcessExit).toHaveBeenCalledWith(ExitCodes.GENERAL);
});
