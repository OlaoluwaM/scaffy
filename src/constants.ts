import { dirname } from 'path';
import { fileURLToPath } from 'url';

// This isn't in the `utils` file to avoid a cyclic dependency error
export function getAbsolutePathsForFile(fileUrl: string) {
  const __filename = fileURLToPath(fileUrl);
  const __dirname = dirname(__filename);

  return { __dirname, __filename };
}

export const { __dirname } = getAbsolutePathsForFile(import.meta.url);

export const SCAFFY_CONFIG_GLOB = '**/*scaffy.json';
export const ERROR_HOOK = 'Error Occurred' as const;

export type ErrorHook = typeof ERROR_HOOK;
export enum ExitCodes {
  OK = 0,
  GENERAL = 1,
  COMMAND_NOT_FOUND = 127,
}

export const LEFT_PADDING_SIZE = 3
