#!/usr/bin/env zx
/* global $ */

import 'zx/globals';

import cli from './cli';

import { pipe } from './utils';
import {
  RawCliArgs,
  extractCliArgs,
  sortOutRawCliArgs,
  default as parseArguments,
} from './lib/parseArgs';

$.verbose = false;

(async () => {
  const rawCliArguments = pipe(extractCliArgs, sortOutRawCliArgs)() as RawCliArgs;
  const argumentsObj = await parseArguments(rawCliArguments);
  cli(argumentsObj);
})();
