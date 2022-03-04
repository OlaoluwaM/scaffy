#!/usr/bin/env zx

import install from './cmds/install';
import outputHelp from './cmds/help';
import outPutCliVersion from './cmds/version';

import { info } from './utils';
import { ExitCodes } from './compiler/types';
import { genericErrorHandler } from './lib/helpers';
import { ParsedArguments, cliApiObj } from './lib/parseArgs';

export default async function cli(parsedArguments: ParsedArguments, cliApi = cliApiObj) {
  const { command, tools, pathToScaffyConfig } = parsedArguments;

  switch (command) {
    case cliApi.install:
    case cliApi.i:
      // await install(t);
      break;

    case cliApi.uninstall:
    case cliApi.un:
      info('Not Implemented');
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
