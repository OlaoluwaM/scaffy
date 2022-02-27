#!/usr/bin/env zx
/* global path */

import 'zx/globals';

import { info } from '../utils';
import { __dirname } from '../constants';
import { retrieveProjectDependencies } from '../lib/helpers';

export default async function outPutCliVersion() {
  const __internalPackageJSon = await retrieveProjectDependencies(
    `${path.dirname(__dirname)}/package.json`
  );

  const { version } = __internalPackageJSon;
  info(`v${version}`);
}
