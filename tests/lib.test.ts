import { ExitCodes } from '../src/compiler/types';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test, expect } from '@jest/globals';
import parseArguments, { CliApiObj, ParsedArguments } from '../src/lib/parseArgs';

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
        pathToScaffyConfig: './scaffy.json',
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
    (str, sampleCliArgs, desiredOutputObj) => {
      // Arrange
      // Act
      const output = parseArguments(sampleCliArgs, CliApiObj);

      // Assert
      expect(output).toEqual(desiredOutputObj);
    }
  );

  test('Should exit on invalid command', () => {
    // Arrange
    const argsToParse = ['oof', '-c', './some/scaffy.json', '-c', '../some/scaffy.json'];
    const mockExit = jest
      .spyOn(process, 'exit')
      .mockImplementationOnce((code?: number) => '1' as never);

    // Act
    parseArguments(argsToParse, CliApiObj);

    // Assert
    expect(mockExit).toHaveBeenCalledWith(ExitCodes.COMMAND_NOT_FOUND);
  });
});
