import { info } from '../utils';

const helpString = `
DESCRIPTION
  scaffy is a CLI application that helps you bootstrap your favorite tools with your custom configurations

USAGE:
  scaffy (command|aliases) <argument>...
  scaffy options

COMMANDS:
  bootstrap <tool>...          Bootstraps <tool> with your custom configuration
  remove <tool>...             Removes custom configurations for <tool>

Aliases:
  b                            Alias for bootstrap command
  rm                           Alias for remove command

Options:
  -h --help                    Show this message.
  -v --version                 Output version information.
`;

export default function outputHelp() {
  info(helpString);
}
