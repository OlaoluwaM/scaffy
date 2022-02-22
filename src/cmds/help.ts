const helpString = `
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

export default helpString;
