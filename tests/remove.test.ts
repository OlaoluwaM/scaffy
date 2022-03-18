/* global test, expect */

import path from 'path';
// import uninstall from '../src/cmds/uninstall';

import { RequiredConfigSchema } from './helpers';
import { isSubset } from '../src/app/utils';
import {
  doesPathExist,
  parseScaffyConfig,
  parseProjectDependencies,
} from '../src/app/helpers';

const pathToSampleProjectDir = path.resolve('./test-data/for-uninstall/');
const pathToScaffyConfig = `${pathToSampleProjectDir}/sample.scaffy.json`;

test.skip('Should make sure un-installation command removes deps and downloads files as required', async () => {
  // Arrange
  const sampleScaffyConfig = await parseScaffyConfig(pathToScaffyConfig);

  const toolToSetup = sampleScaffyConfig.eslint as RequiredConfigSchema;
  // const tools = ['react', 'tailwind', ...Object.keys(sampleScaffyConfig)];

  // Act
  // await uninstall(tools, pathToScaffyConfig);

  const sampleProjectDirPackageJSONObj = await parseProjectDependencies(
    pathToSampleProjectDir
  );
  const samplePackageJsonDeps = Object.keys(sampleProjectDirPackageJSONObj.deps);
  const samplePackageJsonDevDeps = Object.keys(sampleProjectDirPackageJSONObj.devDeps);

  const sampleProjectDepsDoNotContainsScaffyDeps = [
    !isSubset(samplePackageJsonDeps, toolToSetup.deps),
    !isSubset(samplePackageJsonDevDeps, toolToSetup.devDeps),
  ];

  const remoteConfigsWereDeleted = !(await doesPathExist(
    `${pathToSampleProjectDir}/${path.basename(toolToSetup.remoteConfigurations[0])}`
  ));
  const localFilesWereRemoved = !(await doesPathExist(
    `${pathToSampleProjectDir}/${path.basename(toolToSetup.localConfigurations[0])}`
  ));

  // Assert
  expect(sampleProjectDepsDoNotContainsScaffyDeps).toBe([true, true]);
  expect(localFilesWereRemoved).toBe(true);
  expect(remoteConfigsWereDeleted).toBe(true);
});
