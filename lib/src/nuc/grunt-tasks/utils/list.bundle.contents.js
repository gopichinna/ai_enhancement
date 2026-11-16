/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// Returns a list of all modules included in a module bundle -
// a bundle contents. Expects a file path to the output bundle script.
//
// const parse = require('./utils/list.bundle.contents');
// const modules = parse('../out-release/bundles/nuc-models.js');
//
// [
//   {
//     id: 'nuc/models/node/node.model',
//     deps: ['nuc/lib/backbone', 'i18n!nuc/models/node/impl/nls/lang']
//   },
//   ...
// ]

'use strict';

const { readFileSync } = require('fs');

const bundles = new Map();

function parseDependencies(dependencies) {
  // perform the array expression
  // eslint-disable-next-line no-unused-vars
  let temp;
  return dependencies ? eval(`temp = ${dependencies}`) : [];
}

function parseLoader(fileContents) {
  // parsing the consistent format written by the optimizer:
  //   csui.define("name",["dep1", ...],...)
  const moduleDeclaration = /csui\.define\(['"]([^'"]+)['"](?:\s*,\s*(\[[^\]]+\]))?/g;
  const bundleContents = [];
  let match;
  while ((match = moduleDeclaration.exec(fileContents))) {
    let deps = parseDependencies(match[2]);
    deps = deps.filter(dep => dep !== 'require' && dep != 'module' && dep != 'exports');
    bundleContents.push({ id: match[1], deps });
  }
  return bundleContents;
}

function parseModule(fileContents) {
  // just remember the object passed to require.config
  const csui = {
    // eslint-disable-line no-unused-vars
    // disable requiring of bundle stylesheets
    require: () => {},
    // just remember the module name and dependencies
    define: (id, dependencies) => {
      if (typeof id !== 'string') {
        throw new Error('Unnamed module encountered.');
      }
      let deps = Array.isArray(dependencies) ? dependencies : [];
      deps = deps.filter(dep => dep !== 'require' && dep != 'module' && dep != 'exports');
      bundleContents.push({ id, deps });
    }
  };
  // perform the csui.define statements from the bundle contents
  const bundleContents = [];
  eval(fileContents);
  return bundleContents;
}

module.exports = function (filePath) {
  let bundleContents = bundles.get(filePath);
  if (bundleContents) {
    return bundleContents;
  }
  const fileContents = readFileSync(filePath, 'utf-8');
  // loaders do not consist of define statements only and cannot be evaled
  try {
    bundleContents = parseModule(fileContents);
  } catch {
    bundleContents = parseLoader(fileContents);
  }
  if (bundleContents.length === 0) {
    throw new Error(`Parsing "${filePath}" failed.`);
  }
  bundles.set(filePath, bundleContents);
  return bundleContents;
};
