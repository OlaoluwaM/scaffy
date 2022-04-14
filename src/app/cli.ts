import remove from '../cmds/remove';
import bootstrap from '../cmds/bootstrap';
import outputHelp from '../cmds/help';
import outPutCliVersion from '../cmds/version';

import { ExitCodes } from '../constants';
import { genericErrorHandler } from './helpers';
import { ParsedArguments, cliApiObj } from './parseArgs';

export default async function cli(parsedArguments: ParsedArguments, cliApi = cliApiObj) {
  const { command, tools, pathToScaffyConfig } = parsedArguments;

  switch (command) {
    case cliApi.bootstrap:
    case cliApi.b:
      await bootstrap(pathToScaffyConfig, tools);
      break;

    case cliApi.remove:
    case cliApi.rm:
      await remove(pathToScaffyConfig, tools);
      break;

    case cliApi['--help']:
    case cliApi['-h']:
      outputHelp();
      break;

    case cliApi['--version']:
    case cliApi['-v']:
      await outPutCliVersion();
      break;

    default:
      genericErrorHandler(
        `Whoops, ${command} is not a supported command`,
        true,
        ExitCodes.COMMAND_NOT_FOUND
      );
  }
}
