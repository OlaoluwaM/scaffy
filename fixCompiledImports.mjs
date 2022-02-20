#!/usr/bin/env zx
/* global globby, chalk */

import 'zx/globals';

import url from 'url';
import fsPromise from 'fs/promises';

// LOA
// Lang Features --> generic helpers --> specific helpers --> specific business logic

async function patchCompiledJSImports() {
  const jsFilePathArr = await grabAllCompiledJSFiles();
  const jsFilesContentArr = await grabFileContents(jsFilePathArr);
  const updatedJsFileContents = updateCompiledJsImports(jsFilesContentArr);

  await overwriteCompiledJsFiles(jsFilePathArr, updatedJsFileContents);
}

async function grabAllCompiledJSFiles() {
  await doesDistFolderExist();
  return globby('dist/**/*.js');
}

async function doesDistFolderExist() {
  try {
    const stat = await fsPromise.stat('./dist');
    return stat;
  } catch (error) {
    throw new Error(
      'Looks like the ./dist directory is not available. Try running the build command `npm run build` first'
    );
  }
}

async function grabFileContents(files) {
  const fileContentPromises = files.map(filepath =>
    fsPromise.readFile(filepath, 'utf-8')
  );

  const fileContents = await Promise.all(fileContentPromises);
  return fileContents;
}

async function overwriteCompiledJsFiles(filePaths, updatedFileContents) {
  const saveFilePromises = filePaths.map((filepath, ind) =>
    overwriteFile(filepath, updatedFileContents[ind])
  );

  return Promise.all(saveFilePromises);
}

function updateCompiledJsImports(jsFileContentArr) {
  const updatedJsFileContents = jsFileContentArr.map(updateImportStatements);
  info('Imports successfully updated with `.js` extension');

  return updatedJsFileContents;
}

export default function updateImportStatements(jsFileContent) {
  const importRegex =
    /import([ \n\t]*(?:[^ \n\t{}]+[ \n\t]*,?)?(?:[ \n\t]*{(?:[ \n\t]*[^ \n\t"'{}]+[ \n\t]*,?)+})?[ \n\t]*)from[ \n\t]*(['"])([^'"\n]+)(?:['"])/gm;

  const patchedFileContent = jsFileContent.replace(importRegex, subStr => {
    const isStatementSafeToPatch = shouldPatch(subStr);
    if (!isStatementSafeToPatch) return subStr;

    const substringWithoutLastQuote = subStr.substring(0, subStr.length - 1);
    const lastQuote = subStr.slice(-1);

    return `${substringWithoutLastQuote}.js${lastQuote}`;
  });

  return patchedFileContent;
}

function shouldPatch(substr) {
  const modulesToExclude = /url|fs|path/;
  const containsForbiddenModules = modulesToExclude.test(substr);
  const containsJsExtension = substr.includes('.js');

  if (containsForbiddenModules || containsJsExtension) return false;
  return true;
}

async function overwriteFile(path, fileContents) {
  return fsPromise.writeFile(path, fileContents);
}

function info(msg) {
  console.log(chalk.whiteBright.bold(msg));
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  await patchCompiledJSImports();
}
