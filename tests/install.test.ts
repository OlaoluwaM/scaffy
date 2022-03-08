/* eslint-disable import/no-relative-packages */

import path from 'path';
import install from '../src/cmds/install';

import { isSubset } from '../src/utils';
import { testDataDir } from './test-setup';
// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from '@jest/globals';
import { RequiredConfigSchema } from './helpers';
import {
  doesPathExist,
  removeEntityAt,
  parseScaffyConfig,
  parseProjectDependencies,
} from '../src/lib/helpers';

const dataDir = `${testDataDir}/for-install`;
process.chdir(dataDir);

const pathToScaffyConfig = `./sample.scaffy.json`;

test('Should make sure installation command installs deps and downloads files as required', async () => {
  // Arrange
  const sampleScaffyConfig = await parseScaffyConfig(pathToScaffyConfig);
  const toolToSetup = sampleScaffyConfig.eslint as RequiredConfigSchema;
  const tools = ['react', 'tailwind', ...Object.keys(sampleScaffyConfig)];

  // Act
  await install(pathToScaffyConfig, tools);
  await removeEntityAt('./node_modules', 'node modules', { recursive: true });

  const sampleProjectDirPackageJSONObj = await parseProjectDependencies(`./package.json`);
  const samplePackageJsonDeps = Object.keys(sampleProjectDirPackageJSONObj.deps);
  const samplePackageJsonDevDeps = Object.keys(sampleProjectDirPackageJSONObj.devDeps);

  const sampleProjectDepsContainsScaffyDeps = [
    isSubset(samplePackageJsonDeps, toolToSetup.deps),
    isSubset(samplePackageJsonDevDeps, toolToSetup.devDeps),
  ];

  const remoteConfigsWereDownloaded = await doesPathExist(
    `./${path.basename(toolToSetup.remoteConfigurations[0])}`
  );
  const localFilesWereCopied = await doesPathExist(
    `./${path.basename(toolToSetup.localConfigurations[0])}`
  );

  // Assert
  expect(sampleProjectDepsContainsScaffyDeps).toEqual([true, true]);
  expect(localFilesWereCopied).toBe(true);
  expect(remoteConfigsWereDownloaded).toBe(true);
});
