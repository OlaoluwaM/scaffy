#!/usr/bin/env zx
/* global path, fs, chalk, argv */

import 'zx/globals';

interface SingleConfigEntry {
  [toolName: string]: {
    deps: string[];
    devDeps: string[];
    remoteConfigurations: string[];
    localConfigurations: string[];
  };
}

interface Dependencies {
  [depName: string]: string;
}

interface SamplePackageJson {
  dependencies: Dependencies;
  devDependencies: Dependencies;
}

interface ProjectDependencies {
  deps: Dependencies;
  devDeps: Dependencies;
}

const { exit: killWithExitCode } = process;
const projectRootDir = path.resolve('./');

(async () => {
  const installedPackages = await retrieveProjectDependencies();
  const toolsToBootstrap = parseCLIArgs();
  console.log(toolsToBootstrap);
})();

async function retrieveProjectDependencies(): Promise<ProjectDependencies> | never {
  try {
    const packageJsonObject = (await fs.readJSON(
      `${projectRootDir}/package.json`
    )) as SamplePackageJson;

    return {
      deps: packageJsonObject.dependencies,
      devDeps: packageJsonObject.devDependencies,
    };
  } catch {
    error('Failed to retrieve dependencies');
    error("Looks like there isn't a package.json file in your project yet");
    return killWithExitCode(1);
  }
}

function parseCLIArgs(): string[] {
  return process.argv.slice(2);
}

function error(msg: string) {
  console.error(chalk.red.bold(msg));
}
