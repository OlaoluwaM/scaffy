export interface ConfigSchema {
  readonly [toolName: string]: {
    readonly extends:
      | string
      | {
          readonly from: string;
          readonly merge: (
            | 'depNames'
            | 'devDepNames'
            | 'remoteConfigurationUrls'
            | 'localConfigurationPaths'
          )[];
        };
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

export type AnyFunction = (...args: any[]) => any;

export type EnumKeys<E> = keyof E;

export type FilePath = string & { _type: 'file' };
