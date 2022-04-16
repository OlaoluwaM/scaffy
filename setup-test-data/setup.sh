#!/usr/bin/env bash

rootDir=$(dirname "$(realpath "$0")")
DATA_DIR="$(dirname "$rootDir")/tests/test-data"

test -d "$DATA_DIR" && rm -rf "$DATA_DIR"

echo "Seting up test data directory...."

echo "Recreating test data directory"
mkdir "$DATA_DIR"
mkdir $DATA_DIR/{for-learning,for-remote-downloads,for-bootstrap-cmd,for-remove-cmd,sample-scaffy-configs,local-configs,other-data}

echo "Setting up sample local configurations for testing"
touch $DATA_DIR/local-configs/{.prettierrc,stub.js,sample.ts,another-file.ts,main.rs,hello.rs,some.js,help.ts,xxt.ts,srr.ts,m.ts}

echo "Setting up sample sample scaffy config directory for testing"
touch $DATA_DIR/sample-scaffy-configs/{sampleOne,sampleTwo,sampleThree,sampleFour,sampleFive}.scaffy.json
echo "{}" | tee -a $DATA_DIR/sample-scaffy-configs/{sampleOne,sampleTwo,sampleThree,sampleFour,sampleFive}.scaffy.json | cat 1>/dev/null

for DIR in "for-bootstrap-cmd" "for-remove-cmd"; do
  touch $DATA_DIR/$DIR/{sample.scaffy.json,package.json}
done

echo "Setting up directory structure for bootstrap command testing"
cd "${DATA_DIR}/for-bootstrap-cmd" || exit
npm ini -y 1>/dev/null
cd "$rootDir" || exit

cp "${rootDir}/for-bootstrap.json" "${DATA_DIR}/for-bootstrap-cmd/sample.scaffy.json"

echo "Setting up directory structure for remove command testing"
touch $DATA_DIR/for-remove-cmd/{postcss.config.js,stub.js,.eslintrc.js,.prettierrc,webpack.config.js,.babelrc.js,jsconfig.json,main.rs,hello.rs,srr.ts,help.ts,xxt.ts,createDesinationsFile.sh,README.md}

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
    "eslint-plugin-react": "*",
    "emotion": "*",
    "yup": "*",
    "framer-motion": "*",
    "react": "*",
    "vite": "*",
    "ts-node": "*",
    "@xstate/react": "*",
    "nodemon": "*",
    "vue": "*"
  },
  "devDependencies": {
    "eslint": "*",
    "jest": "*",
    "xstate": "*",
    "typescript": "*",
    "zod": "*",
    "latest": "*",
    "webpack-dev-server": "*",
    "webpack": "*"
  },
  "engines": {
    "node": ">= 0.4.1"
  }
}
EOL

cp "${rootDir}/for-remove.json" "${DATA_DIR}/for-remove-cmd/sample.scaffy.json"

echo "Setting up other other-data dir"
cp $rootDir/{valid-config,invalid-config,partial-invalid-config-entries,empty-config}.scaffy.json $DATA_DIR/other-data/

echo -e "Done!\n"
