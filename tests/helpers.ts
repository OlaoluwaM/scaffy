import path from 'path';

// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import {
  addException,
  doesObjectHaveProperty,
  extractBasenameFromPath,
} from '../src/app/utils';
import { ConfigSchema } from '../src/compiler/types';
import { doesPathExist } from '../src/app/helpers';

export type RequiredConfigSchema = Required<ConfigSchema[string]>;

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
    filePathArr.map(extractBasenameFromPath).map(filename => {
      const intendedPath = `${destinationDir}/${filename}`;
      const doesPathExistWithErr = addException<string[], Promise<boolean>>(
        doesPathExist
      );
      return doesPathExistWithErr(intendedPath);
    })
  );
}

export type MockedFunction = ReturnType<typeof jest.fn>;
