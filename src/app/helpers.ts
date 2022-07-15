import path from 'path';
import fsPromise from 'fs/promises';
import outputHelp from '../cmds/help';

import { CONFIG_ENTRY_PROPS, ExitCodes } from '../constants';
import { ConfigEntry, Dependencies } from '../compiler/types';
import { fs, $, globby } from 'zx';
import { error, includedInCollection, isSemverString, objSet } from '../utils';

interface SamplePackageJson {
  readonly version: string;
  readonly dependencies: Dependencies;
  readonly devDependencies: Dependencies;
}
export interface ProjectDependencies extends SamplePackageJson {
  readonly originalObj: {
    -readonly [Key in keyof SamplePackageJson]: SamplePackageJson[Key];
  };
}

export async function parseProjectDependencies(
  pathToPackageJson: string
): Promise<ProjectDependencies> {
  try {
    const packageJsonObject = (await fs.readJSON(pathToPackageJson)) as SamplePackageJson;

    return {
      version: packageJsonObject?.version ?? '1.0.0',
      dependencies: packageJsonObject?.dependencies ?? [],
      devDependencies: packageJsonObject?.devDependencies ?? [],
      originalObj: packageJsonObject,
    };
  } catch {
    error('Failed to retrieve dependencies');
    error("Looks like there isn't a package.json file in your project yet");
    error('Please make sure to run this in the root directory of your project');

    return process.exit(ExitCodes.GENERAL);
  }
}

export async function isCommandAvailable(commandName: string): Promise<boolean> {
  try {
    await $`command -v ${commandName}`;
    return true;
  } catch {
    error(`Hmm, looks like ${commandName} is not installed`);
    return false;
  }
}

interface EntityRemovalOptions {
  force?: boolean;
  recursive?: boolean;
}
const defaultEntityRemovalOptions: EntityRemovalOptions = {
  force: true,
};

export async function removeEntityAt(
  entityPath: string,
  entityName = '',
  options: EntityRemovalOptions = defaultEntityRemovalOptions
) {
  try {
    await fs.rm(entityPath, options);
  } catch (err) {
    error(`Error occurred while trying to remove ${entityName}`);
    error((err as Error).message);
  }
}

export async function doesPathExist(entityPath: string): Promise<boolean> {
  try {
    await fsPromise.stat(entityPath);
    return true;
  } catch (err) {
    return false;
  }
}

export function genericErrorHandler(
  msg: string,
  displayHelp = false,
  exitCode = ExitCodes.GENERAL
): never {
  error(msg);
  if (displayHelp) outputHelp();
  return process.exit(exitCode);
}

export async function searchForFile(globPattern: string | string[]): Promise<string[]> {
  const patternMatches = await globby(globPattern);
  if (patternMatches.length === 0) throw new Error('Could not find any file matches');
  return patternMatches;
}

export function determineRootDirectory(): string {
  return path.resolve('./');
}

export type DepProps = 'dependencies' | 'devDependencies';
export async function updatePackageJsonDeps(
  packageJsonPath: string,
  propToUpdate: DepProps,
  newInfo: Dependencies
) {
  const { originalObj } = await parseProjectDependencies(packageJsonPath);
  const newPackageJSONObj = objSet(originalObj, propToUpdate, newInfo);
  await rewriteExistingPackageJson(packageJsonPath, newPackageJSONObj);
}

async function rewriteExistingPackageJson(
  packageJsonPath: string,
  newPackageJsonData: SamplePackageJson
) {
  try {
    await fsPromise.writeFile(packageJsonPath, JSON.stringify(newPackageJsonData));
  } catch (err) {
    error('Failed to update package.json file');
    error(`The following error occurred: ${err}`);

    process.exit(ExitCodes.GENERAL);
  }
}

export function removeVersionInfoFromDepNames(depNames: string[]): string[] {
  const depNamesWithoutVersionInfo = depNames.map(removeVersionInfoFromDepName);
  return depNamesWithoutVersionInfo;
}

function removeVersionInfoFromDepName(depName: string): string {
  const indexOfAtChar = depName.indexOf('@');
  if (indexOfAtChar === -1) return depName;

  const substringAfterAtChar = depName.slice(indexOfAtChar + 1);
  const isSubstringASemVerString = isSemverString(substringAfterAtChar);

  if (!isSubstringASemVerString) return depName;

  const substringBeforeAtChar = depName.slice(0, indexOfAtChar);
  return substringBeforeAtChar;
}

export function mergeConfigEntries(
  entryBeingExtended: ConfigEntry,
  entryToExtendFrom: ConfigEntry,
  specificKeysToMerge = [...CONFIG_ENTRY_PROPS]
) {
  const mergedObjectEntries = Object.entries(entryBeingExtended).map(entry => {
    const [key] = entry;
    if (!includedInCollection(specificKeysToMerge, key)) return entry;

    const valueToExtendWith = entryToExtendFrom[key] ?? [];
    const currentValuesToBeExtended = entryBeingExtended[key] ?? [];

    const mergedValue = [
      ...new Set([...valueToExtendWith, ...currentValuesToBeExtended]),
    ];

    return [key, mergedValue];
  });

  const mergedConfigEntry = Object.fromEntries(mergedObjectEntries);
  return mergedConfigEntry;
}
