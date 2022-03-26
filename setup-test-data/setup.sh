#!/usr/bin/env bash

rootDir=$(dirname "$(realpath "$0")")
DATA_DIR="$(dirname "$rootDir")/tests/test-data"

test -d "$DATA_DIR" && exit 0

echo "Seting up test data directory...."

echo "Recreating test data directory"
mkdir "$DATA_DIR"
mkdir $DATA_DIR/{for-learning,for-remote-downloads,for-bootstrap-cmd,for-remove-cmd,local-configs,other-data}

echo "Setting up sample local configurations for testing"
touch $DATA_DIR/local-configs/{.prettierrc,stub.js,sample.ts,another-file.ts,main.rs,hello.rs,some.js,help.ts,xxt.ts,srr.ts}

for DIR in "for-bootstrap-cmd" "for-remove-cmd"; do
  touch $DATA_DIR/$DIR/{sample.scaffy.json,package.json}
done

echo "Setting up directory structure for bootstrap command testing"
cd "${DATA_DIR}/for-bootstrap-cmd" || exit
npm ini -y 1>/dev/null
cd "$rootDir" || exit

cp "${rootDir}/for-bootstrap.json" "${DATA_DIR}/for-bootstrap-cmd/sample.scaffy.json"

echo "Setting up directory structure for remove command testing"
touch $DATA_DIR/for-remove-cmd/{postcss.config.js,stub.js}

cat <<EOL >"${DATA_DIR}/for-remove-cmd/package.json"
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

cat <<EOL >"${DATA_DIR}/for-remove-cmd/sample.scaffy.json"
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

echo "Setting up other other-data dir"
cp $rootDir/{valid-config.scaffy.json,invalid-config.scaffy.json,partial-invalid-config-entries.scaffy.json} $DATA_DIR/other-data/

echo "Done!"
