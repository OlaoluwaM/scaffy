import install from './cmds/install/index';
import outPutCliVersion from './cmds/version/index';

import { CliApiString, CliApi } from './constants';
import { info, outputHelp, genericErrorHandler } from './utils';

export default async function cli(command: CliApiString, tools: string[]) {
  switch (command) {
    case CliApi.install:
    case CliApi.i:
      await install(tools);
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
