
import fsPromise from 'fs/promises';

import { $, ProcessOutput } from 'zx';
import { isCommandAvailable, removeEntityAt } from './helpers';
import { error, info, isEmpty, success, toMultiLineString } from '../utils';

const WGET_URL_FILENAME = 'urls.txt';

enum CurlOrWget {
  Curl = 'curl',
  Wget = 'wget',
}
export default async function download(
  urls: string[] | undefined,
  destinationDir: string,
  utilToUse?: CurlOrWget
) {
  if (!urls || isEmpty.array(urls)) return;

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
  info(`Downloading remote configurations....\n`);

  const curlIsInstalled = await isCommandAvailable('curl');
  const wgetIsInstalled = await isCommandAvailable('wget');

  if (curlIsInstalled) {
    await downloadWithCurl(urls, destinationDir);
  } else if (wgetIsInstalled) {
    await downloadWithWget(urls, destinationDir);
  } else {
    error(`Neither curl or wget are installed`);
    return;
  }

  success('Download complete!');
}

async function downloadWithCurl(urls: string[], destinationDir = '.') {
  try {
    await $`curl -LJ --max-time 900 --output-dir "${destinationDir}" --remote-name-all ${urls} 1>/dev/null`;
  } catch (processErr) {
    error(
      `Looks like an error occurred while downloading with curl: ${
        (processErr as ProcessOutput).stderr
      }`
    );
  }
}

async function downloadWithWget(urls: string[], destinationDir = '.'): Promise<void> {
  const WGET_URL_FILE_PATH = `${destinationDir}/${WGET_URL_FILENAME}`;
  await createTempUrlListFileForWgetDownload(urls, destinationDir);

  try {
    await $`wget -i ${WGET_URL_FILE_PATH} -P ${destinationDir} 1>/dev/null`;
  } catch (processError) {
    error(`Error Downloading with wget: ${(processError as ProcessOutput).stderr}\n`);
  } finally {
    await removeEntityAt(WGET_URL_FILE_PATH, 'wget url list file');
  }
}

// Wget needs a file of multiline urls as argument for multiple downloads
async function createTempUrlListFileForWgetDownload(
  urls: string[],
  destinationDir = '.'
) {
  const multilineUrlString = toMultiLineString(urls);

  try {
    await fsPromise.writeFile(
      `${destinationDir}/${WGET_URL_FILENAME}`,
      multilineUrlString
    );
  } catch (err) {
    throw new Error(`Could not create temp-urls file for wget download: ${err}`);
  }
}
