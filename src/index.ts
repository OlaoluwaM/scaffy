#!/usr/bin/env zx
/* global path */

import 'zx/globals';

import cli from './cli.js';

import {
  parseArguments,
  parseScaffyConfig,
  retrieveProjectDependencies,
} from './helpers.js';

const projectRootDir = path.resolve('./');

(async () => {
  const installedPackages = await retrieveProjectDependencies(
    `${projectRootDir}/package.json`
  );

  // TODO We only want to check for a scaffy config for the commands that require it
  const scaffyConfigObj = {};

  const [command, ...toolNames] = parseArguments();
  cli(command, scaffyConfigObj, installedPackages, toolNames);
})();
