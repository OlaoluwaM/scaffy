#!/usr/bin/env node

import cli from './app/cli';

import { $ } from 'zx';
import { pipe } from './utils';
import {
  RawCliArgs,
  extractCliArgs,
  sortOutRawCliArgs,
  default as parseArguments,
} from './app/parseArgs';

$.verbose = false;

(async () => {
  const rawCliArguments = pipe(extractCliArgs, sortOutRawCliArgs)() as RawCliArgs;
  const argumentsObj = await parseArguments(rawCliArguments);
  cli(argumentsObj);
})();
