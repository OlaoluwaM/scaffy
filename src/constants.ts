enum Commands {
  install = 'install',
  uninstall = 'uninstall',
}

enum Options {
  '--help' = '--help',
  '--version' = '--version',
}

enum Aliases {
  i = 'i',
  un = 'un',
  '-h' = '-h',
  '-v' = '-v',
}

export const CliApi = { ...Commands, ...Options, ...Aliases };

export type CliApiString = keyof typeof CliApi;
export type ParsedArguments = [CliApiString, ...string[]];

export const cliApiStrings = Object.keys(CliApi) as CliApiString[];

export const helpString = `
DESCRIPTION
  scaffy is a CLI application that helps you bootstrap your favorite tools with your custom configurations

USAGE:
  scaffy (command|aliases) <argument>...
  scaffy options

COMMANDS:
  install <tool>...          Bootstraps <tool> with your custom configuration
  uninstall <tool>...        Removes custom configurations for <tool>

Aliases:
  i                       Alias for install
  un                      Alias for uninstall

Options:
  -h --help                   Show this message.
  -v --version                Output version information.
`;
