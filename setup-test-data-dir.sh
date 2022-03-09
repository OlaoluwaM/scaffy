#!/usr/bin/env bash

rootDir="$(dirname "$(realpath "$0")")"
DATA_DIR="./tests/test-data"

test -d "$DATA_DIR" && exit 0

echo "Seting up test data directory...."

echo "Recreating test data directory"
mkdir $DATA_DIR
mkdir $DATA_DIR/{for-learning,for-remote-downloads,for-install,for-uninstall,local-configs}

echo "Setting up sample local configurations for testing"
touch $DATA_DIR/local-configs/{.prettierrc,stub.js}

for DIR in "for-install" "for-uninstall"; do
  touch $DATA_DIR/$DIR/{sample.scaffy.json,package.json}
done

echo "Setting up directory structure for installation command testing"
cd "${DATA_DIR}/for-install" || exit
npm ini -y 1>/dev/null
cd "$rootDir" || exit

cat <<EOL >"${DATA_DIR}/for-install/sample.scaffy.json"
{
  "eslint": {
  "deps": ["eslint-plugin-react"],
  "devDeps": ["eslint"],
  "remoteConfigurations": [
  "https://raw.githubusercontent.com/OlaoluwaM/configs/main/typescript/.eslintrc.js"
  ],
  "localConfigurations": ["../local-configs/.prettierrc"]
  }
}
EOL

echo "Setting up directory structure for un-installation command testing"
touch $DATA_DIR/for-uninstall/{postcss.config.js.js,stub.js}

cat <<EOL >"${DATA_DIR}/for-uninstall/package.json"
{
  "name": "test-project-dir",
  "version": "0.0.1",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "dependencies": {
    "eslint-plugin-react": "^7.28.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0"
  },
  "engines": {
    "node": ">= 0.4.1"
  }
}
EOL

cat <<EOL >"${DATA_DIR}/for-uninstall/sample.scaffy.json"
{
  "eslint": {
  "deps": ["eslint-plugin-react"],
  "devDeps": ["eslint"],
  "remoteConfigurations": [
  "https://raw.githubusercontent.com/OlaoluwaM/configs/main/postcss.config.js"
  ],
  "localConfigurations": ["../local-configs/stub.js"]
  }
}
EOL

echo "Done!"
