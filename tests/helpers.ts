import path from 'path';

// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { addException } from '../src/utils';
import { ConfigSchema } from '../src/compiler/types';
import { doesPathExist } from '../src/lib/helpers';

export type RequiredConfigSchema = Required<ConfigSchema[string]>;

export function didAllPromisesSucceed(
  promises: Awaited<ReturnType<typeof Promise.allSettled>>
): boolean {
  return promises.every(isSuccessfulPromise);
}

export function isSuccessfulPromise(
  promise: Awaited<ReturnType<typeof Promise.allSettled>>[number]
): boolean {
  return 'value' in promise;
}

export async function areFilesDownloaded(
  urls: string[],
  destinationDir: string
): Promise<PromiseSettledResult<boolean>[]> {
  return Promise.allSettled(
    urls.map(url => {
      const filename = path.basename(url);
      const intendedPath = `${destinationDir}/${filename}`;
      const doesPathExistWithErr = addException<string[], Promise<boolean>>(
        doesPathExist
      );
      return doesPathExistWithErr(intendedPath);
    })
  );
}

export type MockedFunction = ReturnType<typeof jest.fn>;
