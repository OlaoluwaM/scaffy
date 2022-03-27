export interface ConfigSchema {
  readonly [toolName: string]: {
    readonly deps: string[];
    readonly devDeps: string[];
    readonly remoteConfigurations: string[];
    readonly localConfigurations: string[];
  };
}

export type ConfigEntry = ConfigSchema[string]

export interface Dependencies {
  readonly [depName: string]: string;
}

export interface ProjectDependencies {
  readonly version: string;
  readonly deps: Dependencies;
  readonly devDeps: Dependencies;
}

export type Primitive = string | number;

export type AnyObject = Record<Primitive, unknown>;

export type ToolName = string & { _type: 'tool' };

export enum ExitCodes {
  GENERAL = 1,
  COMMAND_NOT_FOUND = 127,
}

export type AnyFunction = (...args: any[]) => any;

export type EnumKeys<E> = keyof E;
