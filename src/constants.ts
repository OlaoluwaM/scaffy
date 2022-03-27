import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const SCAFFY_CONFIG_GLOB = '**/*scaffy.json';

export const ERROR_HOOK = 'Error Occurred' as const;
export type ErrorHook = typeof ERROR_HOOK;
