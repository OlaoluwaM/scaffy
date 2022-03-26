/* eslint-disable no-restricted-syntax */
import bootstrap from '../src/cmds/bootstrap';

import { testDataDir } from './test-setup';
import { ConfigSchema } from '../src/compiler/types';
import { isEmpty, isSubset, pickObjPropsToAnotherObj } from '../src/utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect, beforeAll } from '@jest/globals';
import { parseProjectDependencies } from '../src/app/helpers';
import {
  doAllFilesExist,
  isSuccessfulPromise,
  RequiredConfigSchema,
  didAllPromisesSucceed,
} from './helpers';

const dataDir = `${testDataDir}/for-bootstrap-cmd`;
const pathToScaffyConfig = `./sample.scaffy.json`;

let toolNames: string[];
let sampleScaffyConfig: ConfigSchema;

beforeAll(async () => {
  process.chdir(dataDir);
  sampleScaffyConfig = await parseScaffyConfig(pathToScaffyConfig);
  toolNames = Object.keys(sampleScaffyConfig);
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

async function computeTooBootstrapResults(
  toolConfigObj: ConfigSchema[string],
  toolName?: string
): Promise<ToolBootstrapResult> {
  const projectDependencies = await parseProjectDependencies(`./package.json`);

  const allPackageJsonDeps = [
    ...Object.keys(projectDependencies.deps),
    ...Object.keys(projectDependencies.devDeps),
  ];

  const allToolDeps = [...(toolConfigObj?.deps ?? []), ...(toolConfigObj?.devDeps ?? [])];

  const installationResults: ToolBootstrapResult = {
    name: toolName,
    toolDepsInstalled: wereToolDepsInstalled(allPackageJsonDeps, allToolDeps),
    configsRetrieved: await areToolConfigFilesAvailableInProjectDir(),
  };

  return installationResults;
}

function wereToolDepsInstalled(projectDeps: string[], toolDeps?: string[]): boolean {
  if (!toolDeps || isEmpty.array(toolDeps)) return true;
  return isSubset(projectDeps, toolDeps);
}

async function areToolConfigFilesAvailableInProjectDir(
  fileArr?: string[]
): Promise<boolean> {
  if (!fileArr || isEmpty.array(fileArr)) return true;

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

test.skip('Should make sure bootstrap command installs deps and retrieves files as required for a single tool scaffolding (bootstrapping)', async () => {
  // Arrange
  const tools = [toolNames[0], 'sfsfsd', 'svwrefrw', 'fewfwe'];
  const toolToBootStrap = sampleScaffyConfig[tools[0]] as RequiredConfigSchema;

  // Act
  await bootstrap(pathToScaffyConfig, tools);

  const wasToolBootStrapASuccess = bootstrapWasSuccessful(
    await computeTooBootstrapResults(toolToBootStrap)
  );

  // Assert
  expect(wasToolBootStrapASuccess).toBe(true);
});

// const testcases: [string, number, number | undefined][] = [
//   [
//     "Should ensure that installation succeeds even if some parts of a tool's config are incorrect'",
//     7,
//     undefined,
//   ],
// ];
const testcases: [string, number, number | undefined][] = [
  ["Should ensure that multiple tools can be bootstrapped successfully'", 1, 4],
  [
    "Should ensure that multiple tools can be bootstrapped even with some undefined config options'",
    4,
    7,
  ],
];
test.each(testcases)('%s', async (str, start, end) => {
  // Arrange
  const tools = toolNames.slice(start, end);

  // Act
  await bootstrap(pathToScaffyConfig, tools);

  // Assert
  const bootstrapResultPromises = tools.map(toolName => {
    const toolConfig = sampleScaffyConfig[toolName];
    return computeTooBootstrapResults(toolConfig, toolName);
  });

  const bootstrapPromiseResults = await Promise.allSettled(bootstrapResultPromises);

  const toolBootstrapResultsBooleanArr = bootstrapPromiseResults.map(promiseResult => {
    if (isSuccessfulPromise(promiseResult)) console.dir(promiseResult?.value);
    return isSuccessfulPromise(promiseResult);
  });

  const allBootstrapAttemptsWereSuccessful = toolBootstrapResultsBooleanArr.every(
    booleanResult => booleanResult === true
  );

  expect(allBootstrapAttemptsWereSuccessful).toBe(true);
});

// test.skip("Should ensure that installation succeeds even when certain parts of a tool's config are omitted", () => {
//   // Arrange
//   // const toolsToBootStrap []
//   // Act
//   // Assert
// });

// test.skip(, () => {
//   // Arrange
//   // Act
//   // Assert
// });
