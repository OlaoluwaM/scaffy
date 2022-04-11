export interface ConfigSchema {
  readonly [toolName: string]: {
    readonly depNames: string[];
    readonly devDepNames: string[];
    readonly remoteConfigurationUrls: string[];
    readonly localConfigurationPaths: string[];
  };
}

export type ConfigEntry = ConfigSchema[string];

type DependencyName = string;
type DependencyVersion = string;
export interface Dependencies {
  readonly [depName: DependencyName]: DependencyVersion;
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
