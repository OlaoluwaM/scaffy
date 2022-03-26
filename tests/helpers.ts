import * as SrcUtils from '../src/utils';
import * as AppHelpers from '../src/app/helpers';

import { ConfigSchema } from '../src/compiler/types';
import { doesPathExist } from '../src/app/helpers';

export type RequiredConfigSchema = Required<ConfigSchema[string]>;

export const srcUtils = SrcUtils;
export const appHelpers = AppHelpers;

export function didAllPromisesSucceed(
  promises: Awaited<ReturnType<typeof Promise.allSettled>>
): boolean {
  return promises.every(isSuccessfulPromise);
}

export function isSuccessfulPromise(
  promise: Awaited<ReturnType<typeof Promise.allSettled>>[number]
): promise is PromiseFulfilledResult<unknown> {
  return promise.status === 'fulfilled';
}

export async function doAllFilesExist(
  filePathArr: string[],
  destinationDir: string
): Promise<PromiseSettledResult<boolean>[]> {
  return Promise.allSettled(
    filePathArr.map(srcUtils.extractBasenameFromPath).map(filename => {
      const intendedPath = `${destinationDir}/${filename}`;
      const doesPathExistWithErr = srcUtils.addException<string[], Promise<boolean>>(
        doesPathExist
      );
      return doesPathExistWithErr(intendedPath);
    })
  );
}
