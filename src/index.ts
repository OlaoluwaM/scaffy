#!/usr/bin/env zx
/* global path, fs */

import 'zx/globals';

import { CliApi } from './constants.js';
import {
  error,
  genericErrorHandler,
  info,
  outputHelp,
  parseArguments,
} from './helpers.js';

import type { CliApiString } from './constants.js';
import type { ProjectDependencies, SamplePackageJson } from './globals';

const projectRootDir = path.resolve('./');

(async () => {
  const installedPackages = await retrieveProjectDependencies();
  const [command, ...toolNames] = parseArguments();
  cli(command, installedPackages, toolNames);
})();

async function retrieveProjectDependencies(): Promise<ProjectDependencies> | never {
  try {
    const packageJsonObject = (await fs.readJSON(
      `${projectRootDir}/package.json`
    )) as SamplePackageJson;

    return {
      version: packageJsonObject.version,
      deps: packageJsonObject.dependencies,
      devDeps: packageJsonObject.devDependencies,
    };
  } catch {
    return handleDepsRetrievalError();
  }
}

function handleDepsRetrievalError(): never {
  error('Failed to retrieve dependencies');
  error("Looks like there isn't a package.json file in your project yet");
  error('Please make sure to run this in the root directory of your project');
  return process.exit(1);
}

async function cli(
  command: CliApiString,
  projectInfo: ProjectDependencies,
  tools: string[]
) {
  switch (command) {
    case CliApi.install:
    case CliApi.i:
      info('Not Implemented');
      break;

    case CliApi.uninstall:
    case CliApi.un:
      info('Not Implemented');
      break;

    case CliApi['--help']:
    case CliApi['-h']:
      outputHelp();
      break;

    case CliApi['--version']:
    case CliApi['-v']:
      info(projectInfo.version);
      break;

    default:
      genericErrorHandler(`Whoops, ${command} is not a supported command`);
  }
}
