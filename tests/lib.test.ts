/* global fs */

import path from 'path';
import download from '../src/lib/downloadFile';

import prompt from 'prompts';
import { ExitCodes } from '../src/compiler/types';
import { testDataDir } from './test-setup';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import {
  ParsedArguments,
  sortOutRawCliArgs,
  default as parseArguments,
} from '../src/lib/parseArgs';
import {
  areFilesDownloaded,
  isSuccessfulPromise,
  didAllPromisesSucceed,
} from './helpers';

describe('Tests for CLI arguments parsing', () => {
  const noThrowCases = [
    [
      'with valid arguments',
      ['i', 'eslint', 'react', '-c', '../dest/scaffy.json'],
      {
        command: 'i',
        tools: ['eslint', 'react'],
        pathToScaffyConfig: '../dest/scaffy.json',
      },
    ],
    [
      'with defaults handled properly',
      ['un', 'react', '@babel/core', 'typescript'],
      {
        command: 'un',
        tools: ['react', '@babel/core', 'typescript'],
        pathToScaffyConfig: path.relative(
          './',
          `${testDataDir}/local-configs/test.scaffy.json`
        ),
      },
    ],
    [
      'with no tools',
      ['install', '--config', '../something/ts.scaffy.json'],
      {
        command: 'install',
        tools: [],
        pathToScaffyConfig: '../something/ts.scaffy.json',
      },
    ],
    [
      'with multiple config options passed',
      ['i', '-c', './some/scaffy.json', '-c', '../some2/scaffy.json'],
      {
        command: 'i',
        tools: [],
        pathToScaffyConfig: './some/scaffy.json',
      },
    ],
  ] as [string, string[], ParsedArguments][];

  test.each(noThrowCases)(
    'Should ensure cli args are parsed correctly %s',
    async (str, sampleCliArgs, desiredOutputObj) => {
      // Arrange
      if (str.includes('defaults')) {
        prompt.inject([(desiredOutputObj as ParsedArguments).pathToScaffyConfig]);
      }

      // Act
      const output = await parseArguments(sortOutRawCliArgs(sampleCliArgs));

      // Assert
      expect(output).toEqual(desiredOutputObj);
    }
  );

  test('Should exit on invalid command', async () => {
    // Arrange
    const argsToParse = sortOutRawCliArgs([
      'oof',
      '-c',
      './some/scaffy.json',
      '-c',
      '../some/scaffy.json',
    ]);

    const mockExit = jest
      .spyOn(process, 'exit')
      .mockImplementationOnce(() => '1' as never);

    // Act
    await parseArguments(argsToParse);

    // Assert
    expect(mockExit).toHaveBeenCalledWith(ExitCodes.COMMAND_NOT_FOUND);
  });
});

describe('Tests for downloading remote configuration', () => {
  // Arrange All
  const sampleUrls = [
    'https://raw.githubusercontent.com/OlaoluwaM/dotfiles/master/others/nativefy.sh',
    'https://raw.githubusercontent.com/OlaoluwaM/configs/main/.eslintignore',
    'https://raw.githubusercontent.com/OlaoluwaM/configs/main/jest.config.js',
    'https://raw.githubusercontent.com/OlaoluwaM/configs/main/craco.config.js',
    'https://raw.githubusercontent.com/OlaoluwaM/configs/main/postcss.config.js',
  ];

  const SUB_TEST_DIR_FOR_TEST = 'for-remote-downloads' as const;
  const destinationDir = `${testDataDir}/${SUB_TEST_DIR_FOR_TEST}`;

  beforeEach(async () => {
    await fs.emptyDir(destinationDir);
  });

  test.each([['curl'], ['wget'], ['no specified command']])(
    'Should make sure that all remote configs can be downloaded with %s',
    async curlOrWget => {
      // Act
      await download(sampleUrls, destinationDir, curlOrWget);

      const allRemoteConfigsDownloaded = didAllPromisesSucceed(
        await areFilesDownloaded(sampleUrls, destinationDir)
      );

      // Assert
      expect(allRemoteConfigsDownloaded).toBe(true);
    }
  );

  test.each([['curl'], ['wget'], ['no specified command']])(
    'Should make sure that remote configs can be downloaded even if some cannot be downloaded using %s',
    async curlOrWget => {
      // Arrange
      const sampleUrlsForThisTest = [...sampleUrls];
      sampleUrlsForThisTest[0] = 'https://hgkgyguiu/gyfkffyyggugi.png';
      sampleUrlsForThisTest[1] = 'https://hgkgyguilbgifuttuku/gyfkffyyiohohhuggugi.png';

      // Act
      await download(sampleUrls, destinationDir, curlOrWget);

      const remoteConfigsDownloadStatuses = await areFilesDownloaded(
        sampleUrlsForThisTest,
        destinationDir
      );

      const numberOfRemoteConfigsDownload =
        remoteConfigsDownloadStatuses.filter(isSuccessfulPromise).length;

      // Assert
      expect(numberOfRemoteConfigsDownload).toBe(sampleUrls.length - 2);

      // Assert
      // let spiedConsole;
      // if (curlOrWget === 'curl') {
      //   spiedConsole = jest.spyOn(console, 'error');
      // }

      // spiedConsole &&
      //   expect(spiedConsole).toHaveBeenCalledWith(
      //     expect.stringMatching(/.*(retrying|wget)/i)
      //   );
    }
  );
});
