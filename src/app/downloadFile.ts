import fsPromise from 'fs/promises';

import { $, ProcessOutput } from 'zx';
import { isCommandAvailable, removeEntityAt } from './helpers';
import { error, info, isEmpty, toMultiLineString } from '../utils';

const { IS_TEST = false } = process.env;
const MAX_TIMEOUT_FOR_DOWNLOAD = IS_TEST ? 5 : 300;
const MAX_RETRIES_FOR_DOWNLOAD = IS_TEST ? 1 : 20;

enum CurlOrWget {
  Curl = 'curl',
  Wget = 'wget',
}

export default async function download(
  urls: string[],
  destinationDir: string,
  utilToUse?: CurlOrWget
) {
  if (isEmpty.array(urls)) return

  switch (utilToUse) {
    case CurlOrWget.Curl:
      await downloadWithCurl(urls, destinationDir);
      break;
    case CurlOrWget.Wget:
      await downloadWithWget(urls, destinationDir);
      break;
    default:
      await downloadWithAvailableCommand(urls, destinationDir);
  }
}

async function downloadWithAvailableCommand(urls: string[], destinationDir: string) {
  const curlIsInstalled = await isCommandAvailable('curl');
  const wgetIsInstalled = await isCommandAvailable('wget');

  if (curlIsInstalled) {
    await downloadWithCurl(urls, destinationDir);
  } else if (wgetIsInstalled) {
    await downloadWithWget(urls, destinationDir);
  } else {
    error(`Neither curl or wget are installed`);
  }
}

async function downloadWithCurl(urls: string[], destinationDir = '.') {
  try {
    await $`curl -LJ --connect-timeout ${MAX_TIMEOUT_FOR_DOWNLOAD} --output-dir "${destinationDir}" --remote-name-all ${urls} 1>/dev/null`;
  } catch (processErr) {
    error(
      `Looks like an error occurred while downloading with curl: ${
        (processErr as ProcessOutput).stderr
      }`
    );

    info('Retrying download with wget...');
    await downloadWithWget(urls, destinationDir);
  }
}

async function downloadWithWget(urls: string[], destinationDir = '.'): Promise<void> {
  const WGET_URL_LIST_FILENAME = 'urls.txt';
  const WGET_URL_LIST_FILE_PATH = `${destinationDir}/${WGET_URL_LIST_FILENAME}`;

  await createTempUrlListFileForWgetDownload(
    urls,
    WGET_URL_LIST_FILENAME,
    destinationDir
  );

  try {
    await $`wget --tries=${MAX_RETRIES_FOR_DOWNLOAD} -T ${MAX_TIMEOUT_FOR_DOWNLOAD} -i ${WGET_URL_LIST_FILE_PATH} -P ${destinationDir} 1>/dev/null`;
  } catch (processError) {
    error(`Error Downloading with wget: ${(processError as ProcessOutput).stderr}\n`);
  } finally {
    await removeEntityAt(WGET_URL_LIST_FILE_PATH, 'wget url list file');
  }
}

// Wget needs a file of multiline urls as argument for multiple downloads
async function createTempUrlListFileForWgetDownload(
  urls: string[],
  urlListFilename: string,
  destinationDir = '.'
) {
  const multilineUrlString = toMultiLineString(urls);

  try {
    await fsPromise.writeFile(`${destinationDir}/${urlListFilename}`, multilineUrlString);
  } catch (err) {
    error(`Could not create temp-urls file for wget download: ${err}`, true);
  }
}
