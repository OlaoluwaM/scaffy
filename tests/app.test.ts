import path from 'path';
import prompt from 'prompts';
import download from '../src/app/downloadFile';

import { ExitCodes } from '../src/constants';
import { ConfigEntry } from '../src/compiler/types';
import { ObjectValidator } from '../src/lib/schema-validator';
import { cd, fs as fsExtra } from 'zx';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from '@jest/globals';
import {
  CONFIG_ENTRY_SCHEMA,
  default as parseScaffyConfig,
} from '../src/app/parseConfig';
import {
  doAllFilesExist,
  append,
  isSuccessfulPromise,
  didAllPromisesSucceed,
} from './helpers';
import {
  ParsedArguments,
  sortOutRawCliArgs,
  CommandsApiString,
  default as parseArguments,
} from '../src/app/parseArgs';
import { testDataDir } from './test-setup';

describe('Tests for CLI arguments parsing', () => {
  const PATH_TO_SAMPLE_CONFIGS = './sample-scaffy-configs';
  const appendSampleConfigDirPath = append.bind(null, `${PATH_TO_SAMPLE_CONFIGS}/`);

  const noThrowCases: [
    string,
    [CommandsApiString, ...string[]],
    ParsedArguments,
    boolean
  ][] = [
    [
      'with valid arguments',
      ['b', 'eslint', 'react', '-c', appendSampleConfigDirPath('sampleOne.scaffy.json')],
      {
        command: 'b',
        tools: ['eslint', 'react'],
        pathToScaffyConfig: appendSampleConfigDirPath('sampleOne.scaffy.json'),
      },
      false,
    ],
    [
      'with defaults handled properly',
      ['rm', 'react', '@babel/core', 'typescript'],
      {
        command: 'rm',
        tools: ['react', '@babel/core', 'typescript'],
        pathToScaffyConfig: path.relative('./', `./local-configs/test.scaffy.json`),
      },
      false,
    ],
    [
      'with no tools',
      ['bootstrap', '--config', appendSampleConfigDirPath('sampleTwo.scaffy.json')],
      {
        command: 'bootstrap',
        tools: [],
        pathToScaffyConfig: appendSampleConfigDirPath('sampleTwo.scaffy.json'),
      },
      false,
    ],
    [
      'with multiple config options passed',
      [
        'b',
        '-c',
        appendSampleConfigDirPath('sampleThree.scaffy.json'),
        '-c',
        '../some2/scaffy.json',
      ],
      {
        command: 'b',
        tools: [],
        pathToScaffyConfig: appendSampleConfigDirPath('sampleThree.scaffy.json'),
      },
      false,
    ],
    [
      'but exit on invalid config argument',
      ['b', '-c', 'tool1'],
      {
        command: 'b',
        tools: [],
        pathToScaffyConfig: '',
      },
      true,
    ],
    [
      'with help alias and some other arguments',
      [
        '-h',
        '-c',
        appendSampleConfigDirPath('sampleFour.scaffy.json'),
        '-c',
        '../some2/scaffy.json',
      ],
      {
        command: '-h',
        tools: [],
        pathToScaffyConfig: '',
      },
      false,
    ],
    [
      'with help alias only',
      ['-h'],
      {
        command: '-h',
        tools: [],
        pathToScaffyConfig: '',
      },
      false,
    ],
    [
      'with help command and some other arguments',
      [
        '--help',
        '-c',
        appendSampleConfigDirPath('sampleFour.scaffy.json'),
        '-c',
        '../some2/scaffy.json',
      ],
      {
        command: '--help',
        tools: [],
        pathToScaffyConfig: '',
      },
      false,
    ],
    [
      'with help command only',
      ['--help'],
      {
        command: '--help',
        tools: [],
        pathToScaffyConfig: '',
      },
      false,
    ],
    [
      'with version alias and some other arguments',
      [
        '-v',
        '-c',
        appendSampleConfigDirPath('sampleFive.scaffy.json'),
        '-c',
        '../some2/scaffy.json',
      ],
      {
        command: '-v',
        tools: [],
        pathToScaffyConfig: '',
      },
      false,
    ],
    [
      'with version alias only',
      ['-v'],
      {
        command: '-v',
        tools: [],
        pathToScaffyConfig: '',
      },
      false,
    ],
    [
      'with version command and some other arguments',
      [
        '--version',
        '-c',
        appendSampleConfigDirPath('sampleFive.scaffy.json'),
        '-c',
        '../some2/scaffy.json',
      ],
      {
        command: '--version',
        tools: [],
        pathToScaffyConfig: '',
      },
      false,
    ],
    [
      'with version command only',
      ['--version'],
      {
        command: '--version',
        tools: [],
        pathToScaffyConfig: '',
      },
      false,
    ],
  ];

  test.each(noThrowCases)(
    'Should ensure cli args are parsed correctly %s',
    async (str, sampleCliArgs, desiredOutputObj, willThrowErr) => {
      // Arrange
      console.log({ p: process.cwd() });
      if (str.includes('defaults')) {
        prompt.inject([(desiredOutputObj as ParsedArguments).pathToScaffyConfig]);
      }

      if (!willThrowErr) {
        // Act
        const output = await parseArguments(sortOutRawCliArgs(sampleCliArgs));

        // Assert
        expect(output).toEqual(desiredOutputObj);
      } else {
        // Assert
        await expect(
          parseArguments(sortOutRawCliArgs(sampleCliArgs))
        ).rejects.toThrowError();
      }
    }
  );

  test('Should exit on invalid command', async () => {
    // Arrange
    console.log({ cwd: process.cwd() });
    const argsToParse = sortOutRawCliArgs([
      'oof',
      '-c',
      appendSampleConfigDirPath('sampleFive.scaffy.json'),
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
  const destinationDir = `./${SUB_TEST_DIR_FOR_TEST}`;

  beforeEach(async () => {
    await fsExtra.emptyDir(destinationDir);
  });

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

      const successfulPromises = isSuccessfulPromise;
      const numberOfRemoteConfigsDownload =
        remoteConfigsDownloadStatuses.filter(successfulPromises).length;

      // Assert
      expect(numberOfRemoteConfigsDownload).toBe(sampleUrls.length - 2);
    }
  );
});

describe('Tests for scaffy schema parsing', () => {
  const configDir = `../other-data`;
  const previousCWD = process.cwd();

  beforeAll(async () => {
    await cd('./for-remove-cmd');
  });

  afterAll(async () => {
    await cd(previousCWD);
  });

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

  test('Should exit if not in valid directory', async () => {
    // Arrange
    await cd(testDataDir);

    const configFilePath = `./other-data/partial-invalid-config-entries.scaffy.json`;

    const mockExit = jest
      .spyOn(process, 'exit')
      .mockImplementationOnce(() => '1' as never);

    // Act
    await parseScaffyConfig(configFilePath);

    // Assert
    expect(mockExit).toHaveBeenCalledWith(ExitCodes.GENERAL);
  });
});
