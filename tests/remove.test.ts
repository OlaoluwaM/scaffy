/* global test, expect */

import path from 'path';
import parseScaffyConfig from '../src/app/parseConfig';
// import uninstall from '../src/cmds/uninstall';

import { isSubset } from '../src/utils';
import { ConfigEntry } from '../src/compiler/types';
import { doesPathExist, parseProjectDependencies } from '../src/app/helpers';

const pathToSampleProjectDir = path.resolve('./test-data/for-uninstall/');
const pathToScaffyConfig = `${pathToSampleProjectDir}/sample.scaffy.json`;

test.skip('Should make sure un-installation command removes depNames and downloads files as required', async () => {
  // Arrange
  const sampleScaffyConfig = await parseScaffyConfig(pathToScaffyConfig);

  const toolToSetup = sampleScaffyConfig.eslint as ConfigEntry;
  // const tools = ['react', 'tailwind', ...Object.keys(sampleScaffyConfig)];

  // Act
  // await uninstall(tools, pathToScaffyConfig);

  const sampleProjectDirPackageJSONObj = await parseProjectDependencies(
    pathToSampleProjectDir
  );
  const samplePackageJsonDeps = Object.keys(sampleProjectDirPackageJSONObj.dependencies);
  const samplePackageJsonDevDeps = Object.keys(
    sampleProjectDirPackageJSONObj.devDependencies
  );

  const sampleProjectDepsDoNotContainsScaffyDeps = [
    !isSubset(samplePackageJsonDeps, toolToSetup.depNames),
    !isSubset(samplePackageJsonDevDeps, toolToSetup.devDepNames),
  ];

  const remoteConfigsWereDeleted = !(await doesPathExist(
    `${pathToSampleProjectDir}/${path.basename(toolToSetup.remoteConfigurationUrls[0])}`
  ));
  const localFilesWereRemoved = !(await doesPathExist(
    `${pathToSampleProjectDir}/${path.basename(toolToSetup.localConfigurationPaths[0])}`
  ));

  // Assert
  expect(sampleProjectDepsDoNotContainsScaffyDeps).toBe([true, true]);
  expect(localFilesWereRemoved).toBe(true);
  expect(remoteConfigsWereDeleted).toBe(true);
});
