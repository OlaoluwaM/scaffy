# Scaffy

This is a simple CLI tool that allows you to bootstrap your projects with your own custom
configuration. Sure we have CRA, and whatever the Vue equivalent of that is, but sometimes
we have configuration files we would like to reuse.

For instance, eslint, sure there is the `init` command but that only gives you the
defaults. In such a case you would need to scour your previous projects (or the internet)
for all the packages you want to install then manually copy over your custom bulletproof
eslint config. This projects intends to be a panacea to that problem!

## What does it do

With the configuration file it will install all the packages you specify and download/copy
over all the configurations you have listed.

Moreover it is idempotent meaning if you have bootstrapped a project with one of your
custom setups, and you try to do it again, nothing happens. Additionally, if prior to
running the CLI you have some packages installed it will only install the missing ones. It
also will feature uninstall capabilities 😉
