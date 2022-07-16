<!-- #### CFPB Open Source Project Template Instructions

1. Create a new project.
2. [Copy these files into the new project](#installation)
3. Update the README, replacing the contents below as prescribed.
4. Add any libraries, assets, or hard dependencies whose source code will be included in
   the project's repository to the _Exceptions_ section in the [TERMS](TERMS.md).

- If no exceptions are needed, remove that section from TERMS.

5. If working with an existing code base, answer the questions on the
   [open source checklist](opensource-checklist.md)
6. Delete these instructions and everything up to the _Project Title_ from the README.
7. Write some great software and tell people about it.

> Keep the README fresh! It's the first thing people see and will make the initial
> impression.

## Installation

To install all of the template files, run the following script from the root of your
project's directory:

```
bash -c "$(curl -s https://raw.githubusercontent.com/CFPB/development/main/open-source-template.sh)"
```

--- -->

# Scaffy

![Logo](demo/logo_transparent.png)

- [Scaffy](#scaffy)
  - [Description](#description)
    - [Built with :boxing_glove:](#built-with-boxing_glove)
  - [Perquisites](#perquisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [LICENSE](#license)

## Description

<!-- Put a meaningful, short, plain-language description of what
this project is trying to accomplish and why it matters.
Describe the problem(s) this project solves.
Describe how this software can improve the lives of its audience. -->

Configuring tools can suck. That's why we customize them once, then store them in some
repo for reuse. This works, but most tools require a set of dependencies, alongside your
custom configurations, to work. This can be a pain, but scaffy is here to help.

I built scaffy because I didn't enjoy constantly browsing for the right combination of
dependencies to get my configurations to work. Furthermore, I'd sometimes use other
people's configs but they would almost always get buried in my abyss of Github
stars/bookmarks which would make searching for them such a hassle.

But with scaffy, I can aggregate all related dependencies and configurations under an
alias and, with that alias, bootstrap my projects with a single command.

<!-- **Screenshot**: If the software has visual components, place a screenshot after the
description; e.g.,
-->

<!-- TODO Add video demo here -->

![Demo](demo/scaffy.demo.gif)

### Built with :boxing_glove:

<!-- **Technology stack**: Indicate the technological nature of the software, including
  primary programming language(s) and whether the software is intended as standalone or as
  a module in a framework or other ecosystem. -->

Scaffy is built with Typescript and it is meant to be used as a standalone CLI utility

<!-- - **Links to production or demo instances**
- Describe what sets this apart from related-projects. Linking to another doc or page is
  OK if this can't be expressed in a sentence or two. -->

## Perquisites

<!-- Describe any dependencies that must be installed for this software to work. This includes
programming languages, databases or other storage mechanisms, build tools, frameworks, and
so forth. If specific versions of other software are required, or known not to work, call
that out. -->

Scaffy doesn't ask much :smile:. All it needs is for node (v16+) and npm to be installed

## Installation

<!-- Detailed instructions on how to install, configure, and get the project running. This
should be frequently tested to ensure reliability. Alternatively, link to a separate
[INSTALL](INSTALL.md) document. -->

```bash
  npm i -g @olaolum/scaffy
```

## Configuration

<!-- If the software is configurable, describe it in detail, either here or in other
documentation to which you link. -->

Taking inspiration from the tsconfig.json, any json file that ends in **.scaffy.json** is
a valid configuration file.

Scaffy will search the root of your project directory for a your configuration file. If it
stumbles upon many, it will give you the option to choose.

The schema for the configuration file is as follows:

```typescript
interface ConfigSchema {
  [name: string]: {
    readonly extends:
      | string
      | {
          readonly from: string;
          readonly merge: (
            | 'depNames'
            | 'devDepNames'
            | 'remoteConfigurationUrls'
            | 'localConfigurationPaths'
          )[];
        };
    depNames?: string[];
    devDepNames?: string[];
    remoteConfigurationUrls?: string[];
    localConfigurationPaths?: string[];
  };
}
```

The schema above states that each entry in the scaffy configuration file must be given a
name. This name can be anything you desire, literally `anything-you-desire`. The names are
naught but a means by which scaffy groups dependencies and configuration files.

All entry members are optional, but at least one member must be valid for the entry to not
be ignored.

Here is an example scaffy config entry

```json
{
  "some-other-config": {
    "devDepNames": ["eslint@latest", "eslint-config-prettier@1.0.0"]
  },
  "cra-eslint": {
    "extends": "some-other-config",
    "devDepNames": ["eslint-plugin-better-styled-components", "eslint-plugin-prettier"],
    "remoteConfigurationUrls": [
      "https://raw.githubusercontent.com/OlaoluwaM/planets-facts-challenge/main/.eslintrc.js",
      "https://raw.githubusercontent.com/OlaoluwaM/planets-facts-challenge/main/.prettierrc"
    ]
  }
}
```

You can also add version information like `@latest` or specific version number like
`@7.3.0` to any of the dependencies listed in the `depNames` or `devDepNames` options

Additionally, in the spirit of DRY, scaffy allows you to extend other configs in whole or
in part. When extending one entry from another, a merge will occur with all properties of
the entries involved (excluding the merging of the `extends` property of course).

To have an entry extend from another, simply add an `extends` key to the extending entry
with the value being the name of the entry to be extended from. An example has been
provided above

For more specific extensions, where you only wish to extend part of an entry, scaffy's got
your back with that too! Here is an example

```json
{
  "sample-parent": {
    "devDepNames": ["eslint", "jest"],
    "remoteConfigurationUrls": [
      "https://raw.githubusercontent.com/OlaoluwaM/configs-deperacated-/master/jsconfig.json"
    ]
  },

  "extending-entry": {
    "extends": {
      "from": "sample-parent",
      "merge": ["devDepNames", "remoteConfigurationUrls"]
    },
    "devDepNames": ["zod"],
    "depNames": ["eslint-plugin-react", "emotion", "yup"],
    "remoteConfigurationUrls": [
      "https://raw.githubusercontent.com/OlaoluwaM/configs/old-do-not-delete/typescript/.eslintrc.js"
    ],
    "localConfigurationPaths": ["../local-configs/.prettierrc"]
  }
}
```

Here, we have the entry `extending-entry` extending only the `devDepNames` and
`remoteConfigurationUrls` from the `sample-parent` entry

## Usage

<!-- Show users how to use the software. Be specific. Use appropriate formatting when showing
code snippets. -->

With the example configuration above, here is how scaffy is used

```bash
  # To bootstrap cra-eslint we can do
  scaffy bootstrap cra-eslint

  # If we feel cra-eslint doesn't do what we want we can remove it using
  scaffy remove cra-eslint

  # For the version
  scaffy -v

  # You can also specify a config file with the following option
  scaffy bootstrap cra-eslint -c ./example.scaffy.json

  # You can get more info run
  scaffy -h
```

<!-- ## How to test the software

If the software includes automated tests, detail how to run those tests. -->

<!-- ## Known issues

Document any known significant shortcomings with the software.

## Getting help

Instruct users how to get help with this software; this might include links to an issue
tracker, wiki, mailing list, etc.

**Example**

If you have questions, concerns, bug reports, etc, please file an issue in this
repository's Issue Tracker.

## Getting involved

This section should detail why people should get involved and describe key areas you are
currently focusing on; e.g., trying to get feedback on features, fixing certain bugs,
building important pieces, etc.

General instructions on _how_ to contribute should be stated with a link to
[CONTRIBUTING](CONTRIBUTING.md). -->

## LICENSE

Copyright © 2022 Olaoluwa Mustapha Released under the MIT license.

<!-- ## Credits and references

1. Projects that inspired you
2. Related projects
3. Books, papers, talks, or other sources that have meaningful impact or influence on this
   project -->

<!-- ## To Do

- Yarn support -->
