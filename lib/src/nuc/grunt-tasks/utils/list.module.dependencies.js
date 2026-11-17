/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// Returns a list of public modules exposed from a module bundle -
// a bundle index. Expects a file path to the bundle index module.
//
// const parse = require('./utils/list.module.dependencies');
// const modules = parse('bundles/nuc-models.js');
//
// ['nuc/models/node/node.model', 'nuc/utils/connector', ...]

'use strict';

const { readFileSync } = require('fs');

const bundles = new Map();

function parseModule(fileContents) {
  // disable requiring of bundle stylesheets
  // eslint-disable-next-line no-unused-vars
  function require() {}

  // just remember the module dependencies, which are the bundle index
  // for modules representing module bundles
  // eslint-disable-next-line no-unused-vars
  function define(name, dependencies) {
    bundleIndex = Array.isArray(name) ? name : dependencies;
  }

  // perform the define and require statements from the module source
  let bundleIndex;
  eval(fileContents);
  return bundleIndex;
}

module.exports = function (filePath) {
  let bundleIndex = bundles.get(filePath);
  if (bundleIndex) {
    return bundleIndex;
  }
  const fileContents = readFileSync(filePath, 'utf-8');
  bundleIndex = parseModule(fileContents);
  if (!bundleIndex) {
    throw new Error(`Parsing "${filePath}" failed.`);
  }
  bundles.set(filePath, bundleIndex);
  return bundleIndex;
};
