export interface ConfigSchema {
  [toolName: string]: {
    deps?: string[];
    devDeps?: string[];
    remoteConfigurations?: string[];
    localConfigurations?: string[];
  };
}

export interface Dependencies {
  [depName: string]: string;
}

export interface ProjectDependencies {
  version: string;
  deps: Dependencies;
  devDeps: Dependencies;
}

export type Primitive = string | number;

export type AnyObject = Record<Primitive, unknown>;

export type ToolName = string & { _type: 'tool' };
