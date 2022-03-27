import path from 'path';
import prompt from 'prompts';
import download from '../src/app/downloadFile';

import { fs as fsExtra } from 'zx';
import { testDataDir } from './test-setup';
import { ObjectValidator } from '../src/lib/schema-validator';
import { ConfigEntry, ExitCodes } from '../src/compiler/types';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { doAllFilesExist, isSuccessfulPromise, didAllPromisesSucceed } from './helpers';
import {
  ParsedArguments,
  sortOutRawCliArgs,
  CommandsApiString,
  default as parseArguments,
} from '../src/app/parseArgs';
import {
  CONFIG_ENTRY_SCHEMA,
  default as parseScaffyConfig,
} from '../src/app/parseConfig';

describe('Tests for CLI arguments parsing', () => {
  const noThrowCases: [string, [CommandsApiString, ...string[]], ParsedArguments][] = [
    [
      'with valid arguments',
      ['b', 'eslint', 'react', '-c', '../dest/scaffy.json'],
      {
        command: 'b',
        tools: ['eslint', 'react'],
        pathToScaffyConfig: '../dest/scaffy.json',
      },
    ],
    [
      'with defaults handled properly',
      ['rm', 'react', '@babel/core', 'typescript'],
      {
        command: 'rm',
        tools: ['react', '@babel/core', 'typescript'],
        pathToScaffyConfig: path.relative(
          './',
          `${testDataDir}/local-configs/test.scaffy.json`
        ),
      },
    ],
    [
      'with no tools',
      ['bootstrap', '--config', '../something/ts.scaffy.json'],
      {
        command: 'bootstrap',
        tools: [],
        pathToScaffyConfig: '../something/ts.scaffy.json',
      },
    ],
    [
      'with multiple config options passed',
      ['b', '-c', './some/scaffy.json', '-c', '../some2/scaffy.json'],
      {
        command: 'b',
        tools: [],
        pathToScaffyConfig: './some/scaffy.json',
      },
    ],
    [
      'with help alias and some other arguments',
      ['-h', '-c', './some/scaffy.json', '-c', '../some2/scaffy.json'],
      {
        command: '-h',
        tools: [],
        pathToScaffyConfig: '',
      },
    ],
    [
      'with help alias only',
      ['-h'],
      {
        command: '-h',
        tools: [],
        pathToScaffyConfig: '',
      },
    ],
    [
      'with help command and some other arguments',
      ['--help', '-c', './some/scaffy.json', '-c', '../some2/scaffy.json'],
      {
        command: '--help',
        tools: [],
        pathToScaffyConfig: '',
      },
    ],
    [
      'with help command only',
      ['--help'],
      {
        command: '--help',
        tools: [],
        pathToScaffyConfig: '',
      },
    ],
    [
      'with version alias and some other arguments',
      ['-v', '-c', './some/scaffy.json', '-c', '../some2/scaffy.json'],
      {
        command: '-v',
        tools: [],
        pathToScaffyConfig: '',
      },
    ],
    [
      'with version alias only',
      ['-v'],
      {
        command: '-v',
        tools: [],
        pathToScaffyConfig: '',
      },
    ],
    [
      'with version command and some other arguments',
      ['--version', '-c', './some/scaffy.json', '-c', '../some2/scaffy.json'],
      {
        command: '--version',
        tools: [],
        pathToScaffyConfig: '',
      },
    ],
    [
      'with version command only',
      ['--version'],
      {
        command: '--version',
        tools: [],
        pathToScaffyConfig: '',
      },
    ],
  ];

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
    await fsExtra.emptyDir(destinationDir);
  });

  // TODO: First case 'curl' fails on initial run
  test.each([['curl'], ['wget'], ['no specified command']])(
    'Should make sure that all remote configs can be downloaded with %s',
    async curlOrWget => {
      // Act
      await download(sampleUrls, destinationDir, curlOrWget);

      const allRemoteConfigsDownloaded = didAllPromisesSucceed(
        await doAllFilesExist(sampleUrls, destinationDir)
      );

      // Assert
      expect(allRemoteConfigsDownloaded).toBe(true);
    }
  );

  // TODO: fails on initial run
  test.each([['curl'], ['wget'], ['no specified command']])(
    'Should make sure that remote configs can be downloaded even if some cannot be downloaded using %s',
    async curlOrWget => {
      // Arrange
      const sampleUrlsForThisTest = [...sampleUrls];
      sampleUrlsForThisTest[0] = 'https://hgkgyguiu/gyfkffyyggugi.png';
      sampleUrlsForThisTest[1] = 'https://hgkgyguilbgifuttuku/gyfkffyyiohohhuggugi.png';

      // Act
      await download(sampleUrls, destinationDir, curlOrWget);

      const remoteConfigsDownloadStatuses = await doAllFilesExist(
        sampleUrlsForThisTest,
        destinationDir
      );

      const numberOfRemoteConfigsDownload =
        remoteConfigsDownloadStatuses.filter(isSuccessfulPromise).length;

      // Assert
      expect(numberOfRemoteConfigsDownload).toBe(sampleUrls.length - 2);
    }
  );
});

describe('Tests for scaffy schema parsing', () => {
  const configDir = `${testDataDir}/other-data`;

  test('That parser succeeds with valid config file ', async () => {
    // Arrange
    const configFilePath = `${configDir}/valid-config.scaffy.json`;
    const rawConfigObj = await fsExtra.readJson(configFilePath);

    // Act
    const parsedConfigObj = await parseScaffyConfig(configFilePath);

    // Assert
    expect(parsedConfigObj).toEqual(rawConfigObj);
  });

  test.each([
    ['on invalid config file', 'invalid-config.scaffy.json'],
    ['on empty config file', 'empty-config.scaffy.json'],
  ])('That parser errors out %s', async configBasename => {
    // Arrange
    const configFilePath = `${configDir}/${configBasename}`;
    const spiedStderr = jest.spyOn(console, 'error');
    const spiedProcess = jest
      .spyOn(process, 'exit')
      .mockImplementationOnce(() => true as never);

    // Act
    await parseScaffyConfig(configFilePath);

    // Assert
    expect(spiedStderr).toHaveBeenCalled();
    expect(spiedProcess).toHaveBeenCalledWith(1);
  });

  test('That parser normalizes fuzzy entries in config file', async () => {
    // Arrange
    const configFilePath = `${configDir}/partial-invalid-config-entries.scaffy.json`;

    // Act
    const parsedConfigObj = await parseScaffyConfig(configFilePath);

    const allConfigEntriesAreNormalized = Object.values(parsedConfigObj).every(
      toolConfigEntry => {
        const { isValid } = ObjectValidator<ConfigEntry>(CONFIG_ENTRY_SCHEMA)({
          value: toolConfigEntry,
          path: ['parsedConfigObj'],
        });

        return isValid;
      }
    );

    // Assert
    expect(allConfigEntriesAreNormalized).toBe(true);
  });
});
