#!/usr/bin/env zx
/* global $ */

import 'zx/globals';

import cli from './app/cli';

import { pipe } from './app/utils';
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
