import { ConfigSchema } from '../src/compiler/types';

export type RequiredConfigSchema = Required<ConfigSchema[string]>;
