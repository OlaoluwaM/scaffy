#!/usr/bin/env zx
/* global */

import 'zx/globals';

import cli from './cli';

import { parseArguments } from './helpers';

(async () => {
  const [command, ...toolNames] = parseArguments();
  cli(command, toolNames);
})();
