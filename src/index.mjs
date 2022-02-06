#!/usr/bin/env zx
import 'zx/globals';

/* global path, fs, chalk */
const { exit: killWithExitCode } = process;

// const testInstallationObject = {
//   deps: ['a', 'b', 'c'],
//   devDeps: ['devA', 'devB', 'devC'],
//   remoteConfigurations: ['https://github.com/someuser/configs/.prettierrc'],
//   localConfigurations: ['~/Desktop/olaolu_dev/dev/somewhere'],
// };

const projectRootDir = path.resolve('./');

function error(msg) {
  console.error(chalk.redBright(msg));
}

async function parseDependenciesInProject() {
  try {
    const packageJSONFile = await fs.readJSON(`${projectRootDir}/packge.json`);
    return {}
  } catch {
    error('Looks like there is no package.json file in your project root');
    killWithExitCode(1);
  }
}

const installedDependencies = await parseDependenciesInProject();
// async function setupCustomTool(nameOfTool, shouldRemove = false) {
//   info(`Setting up ${nameOfTool}`)
//   const toolInstallationReq = await grabReqsFromConfig(nameOfTool);

//   // These can be done in parallel
//   await installDependencies(toolInstallationReq, shouldRemove);
//   await installDevDependencies(toolInstallationReq, shouldRemove);
//   await downloadRemoteConfigs(toolInstallationReq, shouldRemove);
//   await copyLocalConfigs(toolInstallationReq, shouldRemove);

//   success('name of tool has been successfully installed \n');
// }
