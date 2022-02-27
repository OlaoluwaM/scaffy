async function downloadRemoteConfigs(urls: string[]) {
  const wgetInstallStatus = await checkForCommand('wget');
  const curlInstallStatus = await checkForCommand('curl');

  if (curlInstallStatus === InstallationStatus.Installed) {
    downloadWithCurl(urls);
  } else if (wgetInstallStatus === InstallationStatus.Installed) {
    downloadWithWget(urls);
  } else throw new Error(`Neither curl or wget are installed`);
}

async function downloadWithWget(urls: string[]) {
  const WGET_URL_FILENAME = 'temp-urls.txt';
  const WGET_URL_FILE_PATH = `${projectRootDir}/${WGET_URL_FILENAME}`;

  await createTempUrlFileForWgetDownload(WGET_URL_FILENAME, urls);

  try {
    await $`wget -i ${WGET_URL_FILE_PATH}`;
  } catch (processError) {
    throw new Error(
      `Error Downloading with wget: ${(processError as ProcessOutput).stderr}`
    );
  } finally {
  }
}

async function deleteTempUrlListFile(path: string) {
  try {
    await $`rm ${path}`;
  } catch (error) {}
}

// Wget accepts a file of multiline urls as argument for multiple downloads
async function createTempUrlListFileForWgetDownload(filename: string, urls: string[]) {
  const multilineUrlString = toMultiLineString(urls);

  try {
    await fsPromise.writeFile(`${projectRootDir}/${filename}`, multilineUrlString);
  } catch {
    throw new Error('Could not create temp-urls file for wget download');
  }
}
