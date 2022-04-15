import path from 'path';

import { info } from '../utils';
import { __dirname } from '../constants';
import { parseProjectDependencies } from '../app/helpers';

export default async function outPutCliVersion() {
  const __internalPackageJSON = await parseProjectDependencies(
    `${path.dirname(__dirname)}/package.json`
  );

  const { version } = __internalPackageJSON;
  info(`v${version}`, 0);
}
