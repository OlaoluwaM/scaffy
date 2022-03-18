#!/usr/bin/env zx
/* global fs */

import 'zx/globals';

import { error, isEmpty, valueIs } from './utils';
import { AnyObject, ConfigSchema } from '../compiler/types';

type RawConfigSchema = { [toolName: string]: Partial<ConfigSchema[string]> };

const defaultConfigObj: ConfigSchema[string] = {
  deps: [],
  devDeps: [],
  localConfigurations: [],
  remoteConfigurations: [],
};

export async function parseScaffyConfig(path: string): Promise<ConfigSchema> {
  try {
    const rawConfig = (await fs.readJSON(path)) as unknown;
    validateRawConfig(rawConfig);
    // const configObjAsArray = Object.entries(configObject).map(([_, toolConfEntry]) => ({
    //   ...defaultConfigObj,
    // }));
    // return configObject;
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

function validateRawConfig(rawConfig: unknown): asserts rawConfig is RawConfigSchema {
  const parsedConfigIsNotAnObject = valueIs.not.anObject(rawConfig);
  if (parsedConfigIsNotAnObject) throw new TypeError('Your config must be an object');

  const parsedConfigObjIsEmpty = isEmpty.obj(rawConfig as {});
  if (parsedConfigObjIsEmpty) throw new Error('Your config is empty');

  const anyKeyInParsedConfigIsNotAString = Object.keys(rawConfig as {}).some(
    valueIs.not.aString
  );
  if (anyKeyInParsedConfigIsNotAString)
    throw new TypeError('All keys in your config must be strings');
}

function validateConfigEntryForTools(rawConfig: RawConfigSchema): ConfigSchema {
  const toolEntriesArray = Object.entries(rawConfig);
  const normalizedToolEntries = toolEntriesArray.map(([_, toolEntryObj]) => {});
}

function validateConfigEntrySchema(config: AnyObject): ConfigSchema[string] {
  const foo: (keyof ConfigSchema[string])[] = Object.keys(defaultConfigObj);
}
