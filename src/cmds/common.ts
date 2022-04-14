import parseScaffyConfig from '../app/parseConfig';

import { genericErrorHandler } from '../app/helpers';
import { ConfigEntry, ConfigSchema, Dependencies } from '../compiler/types';
import { isEmpty, pickObjPropsToAnotherObj, extractSetFromCollection } from '../utils';

type RestOfCommandFn = (
  scaffyConfObj: ConfigSchema,
  toolsInScaffyConfig: string[]
) => Promise<void>;
export function CommandTemplate(restOfCommand: RestOfCommandFn) {
  return async (pathToScaffyConfig: string, rawToolsSpecified: string[]) => {
    const scaffyConfObj = await parseScaffyConfig(pathToScaffyConfig);

    const toolsInScaffyConfig = filterToolsAvailableInScaffyConfig(
      rawToolsSpecified,
      scaffyConfObj
    );

    exitIfThereAreNoToolsToBootstrap(toolsInScaffyConfig);

    await restOfCommand(scaffyConfObj, toolsInScaffyConfig);
  };
}

function exitIfThereAreNoToolsToBootstrap(toolsInScaffyConfig: string[]) {
  if (!isEmpty.array(toolsInScaffyConfig)) return;
  genericErrorHandler(
    'Seems like non of those tools were specified in your scaffy config',
    false
  );
}

function filterToolsAvailableInScaffyConfig(
  rawPassedInTools: string[],
  scaffyConf: ConfigSchema
): string[] {
  const scaffyToolNames = Object.keys(scaffyConf);
  return extractSetFromCollection(rawPassedInTools, scaffyToolNames);
}

export interface DepsMap {
  depNames: string[];
  devDepNames: string[];
}
export function aggregateToolDependencies(
  fnToInvokeWithAggregatedDeps: (depsMap: DepsMap) => Promise<void>
) {
  return async (toolsToBootStrap: string[], scaffyConfObj: ConfigSchema) => {
    const aggregateDependenciesToBeInstalled = aggregateDepTypeForDesiredTools(
      toolsToBootStrap,
      scaffyConfObj,
      'depNames'
    );

    const aggregateDevDependenciesToBeInstalled = aggregateDepTypeForDesiredTools(
      toolsToBootStrap,
      scaffyConfObj,
      'devDepNames'
    );

    const depsMap: DepsMap = {
      depNames: aggregateDependenciesToBeInstalled,
      devDepNames: aggregateDevDependenciesToBeInstalled,
    };

    await fnToInvokeWithAggregatedDeps(depsMap);
  };
}

type DependencyTypes = Extract<keyof ConfigEntry, 'depNames' | 'devDepNames'>;
function aggregateDepTypeForDesiredTools(
  tools: string[],
  scaffyConfObj: ConfigSchema,
  dependencyTypeToAggregate: DependencyTypes
) {
  const aggregateDeps = tools.flatMap(toolName => {
    const toolNameConfigEntry = scaffyConfObj[toolName];
    const targetDependencies = toolNameConfigEntry[dependencyTypeToAggregate];
    return targetDependencies;
  });

  return aggregateDeps;
}

export type ToolConfigs = Pick<
  ConfigEntry,
  'localConfigurationPaths' | 'remoteConfigurationUrls'
>;
type ToolDeps = Pick<ConfigEntry, 'depNames' | 'devDepNames'>;

export function extractScaffyConfigSections(toolConfObj: ConfigEntry): {
  toolConfigs: ToolConfigs;
  toolDeps: ToolDeps;
} {
  const toolConfigs = pickObjPropsToAnotherObj(toolConfObj, [
    'localConfigurationPaths',
    'remoteConfigurationUrls',
  ]);
  const toolDeps = pickObjPropsToAnotherObj(toolConfObj, ['depNames', 'devDepNames']);
  return { toolConfigs, toolDeps };
}

export function generateDepsObj(depNames: string[]): Dependencies {
  const DEFAULT_DEP_VERSION = '*' as const;
  type DepEntry = [string, typeof DEFAULT_DEP_VERSION];

  const depObjEntries: DepEntry[] = depNames.map(depName => [
    depName,
    DEFAULT_DEP_VERSION,
  ]);

  const depObj: Dependencies = Object.fromEntries(depObjEntries);
  return depObj;
}
