import outPutCliVersion from './cmds/version/index.js';

import { CliApiString, CliApi } from './constants.js';
import { info, outputHelp, genericErrorHandler } from './utils.js';

import type { ConfigSchema, ProjectDependencies } from './globals';

export default async function cli(
  command: CliApiString,
  scaffyConfigObj: ConfigSchema,
  projectInfo: ProjectDependencies,
  tools: string[]
) {
  switch (command) {
    case CliApi.install:
    case CliApi.i:
      info('Not Implemented');
      break;

    case CliApi.uninstall:
    case CliApi.un:
      info('Not Implemented');
      break;

    case CliApi['--help']:
    case CliApi['-h']:
      outputHelp();
      break;

    case CliApi['--version']:
    case CliApi['-v']:
      await outPutCliVersion();
      break;

    default:
      genericErrorHandler(`Whoops, ${command} is not a supported command`);
  }
}
