#!/usr/bin/env node

import cli from './app/cli';

import { $ } from 'zx';
import { EnumKeys } from './compiler/types';
import { info, pipe } from './utils';
import { ExitCodes, KILL_CODE_NUM_MAP, KILL_SIGNAL } from './constants';
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

function handleSignal(signal: EnumKeys<typeof KILL_CODE_NUM_MAP>) {
  info(`\nTill Next time`, 0);
  process.exit(ExitCodes.KILLED + KILL_CODE_NUM_MAP[signal]);
}

process.on(KILL_SIGNAL.INTERRUPT, handleSignal);
process.on(KILL_SIGNAL.TERMINATE, handleSignal);
