#!/usr/bin/env zx
/* global path */

import 'zx/globals';

import { info } from './utils';
import { __dirname } from '../app/constants';
import { parseProjectDependencies } from '../app/helpers';

export default async function outPutCliVersion() {
  const __internalPackageJSon = await parseProjectDependencies(
    `${path.dirname(__dirname)}/package.json`
  );

  const { version } = __internalPackageJSon;
  info(`v${version}`);
}
