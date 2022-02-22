/* eslint-disable import/no-relative-packages */
/* global test, expect */

import path from 'path';
import install from '../src/cmds/install';

import { RequiredConfigSchema } from './helpers';
import { doesPathExist, isSubset, removeEntityAt } from '../src/utils';
import { parseScaffyConfig, retrieveProjectDependencies } from '../src/helpers';

const pathToSampleProjectDir = path.resolve('./test-data/for-install/');

test.skip('Should make sure installation command installs deps and downloads files as required', async () => {
  // Arrange
  const sampleScaffyConfig = await parseScaffyConfig(
    `${pathToSampleProjectDir}/sample.scaffy.json`
  );
  const toolToSetup = sampleScaffyConfig.eslint as RequiredConfigSchema;
  const tools = ['react', 'tailwind', ...Object.keys(sampleScaffyConfig)];

  // Act
  await install(tools, pathToSampleProjectDir);
  await removeEntityAt('./node_modules', true);

  const sampleProjectDirPackageJSONObj = await retrieveProjectDependencies(
    pathToSampleProjectDir
  );
  const samplePackageJsonDeps = Object.keys(sampleProjectDirPackageJSONObj.deps);
  const samplePackageJsonDevDeps = Object.keys(sampleProjectDirPackageJSONObj.devDeps);

  const sampleProjectDepsContainsScaffyDeps = [
    isSubset(samplePackageJsonDeps, toolToSetup.deps),
    isSubset(samplePackageJsonDevDeps, toolToSetup.devDeps),
  ];

  const remoteConfigsWereDownloaded = await doesPathExist(
    `${pathToSampleProjectDir}/${path.basename(toolToSetup.remoteConfigurations[0])}`
  );
  const localFilesWereCopied = await doesPathExist(
    `${pathToSampleProjectDir}/${path.basename(toolToSetup.localConfigurations[0])}`
  );

  // Assert
  expect(sampleProjectDepsContainsScaffyDeps).toBe([true, true]);
  expect(localFilesWereCopied).toBe(true);
  expect(remoteConfigsWereDownloaded).toBe(true);
});
