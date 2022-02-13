export interface ConfigSchema {
  [toolName: string]: {
    deps: string[];
    devDeps: string[];
    remoteConfigurations: string[];
    localConfigurations: string[];
  };
}

export interface Dependencies {
  [depName: string]: string;
}

export interface SamplePackageJson {
  version: string;
  dependencies: Dependencies;
  devDependencies: Dependencies;
}

export interface ProjectDependencies {
  version: string;
  deps: Dependencies;
  devDeps: Dependencies;
}
