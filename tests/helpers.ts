import { doesPathExist } from '../src/app/helpers';
import { extractBasenameFromPath, addException } from '../src/utils';

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

export function append(partA: string, partB: string): string {
  return `${partA}${partB}`;
}

export function removeTrailingSlash(path: string): string {
  const REGEX_FOR_TRAILING_SLASH = /\/$/;
  const pathWithoutTrailingSlash = path.replace(REGEX_FOR_TRAILING_SLASH, '');

  return pathWithoutTrailingSlash;
}
