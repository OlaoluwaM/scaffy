import { info } from '../utils';

const helpString = `
DESCRIPTION
  scaffy is a CLI application that helps you bootstrap your favorite tools with your custom configurations

USAGE:
  scaffy (command|aliases) <arguments>...

  scaffy -h
  scaffy -v

  scaffy b tool1 tool2 tool3
  scaffy rm tool1 tool2 tool3

  scaffy b tool11 tool12 -c /path/to/config/to/use

COMMANDS:
  bootstrap <tool>...          Bootstraps <tool> with your custom configuration
  remove <tool>...             Removes custom configurations for <tool>

Aliases:
  b                            Alias for bootstrap command
  rm                           Alias for remove command

Options:
  -h, --help                   Show this message.
  -v, --version                Output version information.
  -c, --config                 Use to point scaffy to a config file
`;

export default function outputHelp() {
  info(helpString, 0);
}
