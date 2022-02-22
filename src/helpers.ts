#!/usr/bin/env zx
/* global fs, $ */

import 'zx/globals';

import fsPromise from 'fs/promises';

import { ProcessOutput } from 'zx';
import { ParsedArguments, cliApiStrings, projectRootDir } from './constants';
import { ConfigSchema, ProjectDependencies, Dependencies } from './compiler/types';
import {
  error,
  getCliArguments,
  isCommandAvailable,
  toMultiLineString,
  genericErrorHandler,
  includedInCollection,
} from './utils';

interface SamplePackageJson {
  version: string;
  dependencies: Dependencies;
  devDependencies: Dependencies;
}
export async function retrieveProjectDependencies(
  path: string
): Promise<ProjectDependencies> | never {
  try {
    const packageJsonObject = (await fs.readJSON(path)) as SamplePackageJson;

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

export async function parseScaffyConfig(path: string): Promise<ConfigSchema> | never {
  try {
    const configObject = (await fs.readJSON(path)) as ConfigSchema;
    return configObject;
  } catch {
    return handleConfigParseError();
  }
}
function handleConfigParseError(): never {
  error(
    'Looks like your are missing a `scaffy.json` file in the root directory of your project'
  );
  return process.exit(1);
}

export function parseArguments(): ParsedArguments | never {
  const cliArgs = getCliArguments();

  if (includedInCollection(cliApiStrings, cliArgs[0])) {
    return cliArgs as ParsedArguments;
  }

  return genericErrorHandler(`${cliArgs[0]} is not a supported command`);
}

export function determineAvailableToolsFromInput(
  scaffyConfig: ConfigSchema,
  requestedToolNames: string[]
): string[] {
  const toolsInConfig = Object.keys(scaffyConfig);
  return requestedToolNames.filter(toolName => toolsInConfig.includes(toolName));
}

// async function downloadRemoteConfigs(urls: string[]) {
//   const wgetInstallStatus = await checkForCommand('wget');
//   const curlInstallStatus = await checkForCommand('curl');

//   if (curlInstallStatus === InstallationStatus.Installed) {
//     downloadWithCurl(urls);
//   } else if (wgetInstallStatus === InstallationStatus.Installed) {
//     downloadWithWget(urls);
//   } else throw new Error(`Neither curl or wget are installed`);
// }

// async function downloadWithWget(urls: string[]) {
//   const WGET_URL_FILENAME = 'temp-urls.txt';
//   const WGET_URL_FILE_PATH = `${projectRootDir}/${WGET_URL_FILENAME}`;

//   await createTempUrlFileForWgetDownload(WGET_URL_FILENAME, urls);

//   try {
//     await $`wget -i ${WGET_URL_FILE_PATH}`;
//   } catch (processError) {
//     throw new Error(
//       `Error Downloading with wget: ${(processError as ProcessOutput).stderr}`
//     );
//   } finally {
//   }
// }

// async function deleteTempUrlListFile(path: string) {
//   try {
//     await $`rm ${path}`;
//   } catch (error) {}
// }

// // Wget accepts a file of multiline urls as argument for multiple downloads
// async function createTempUrlListFileForWgetDownload(filename: string, urls: string[]) {
//   const multilineUrlString = toMultiLineString(urls);

//   try {
//     await fsPromise.writeFile(`${projectRootDir}/${filename}`, multilineUrlString);
//   } catch {
//     throw new Error('Could not create temp-urls file for wget download');
//   }
// }
