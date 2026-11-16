/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// Returns a parsed r.js build configuration. Expects a script with the
// `require.config` statement.
//
// const parse = require('./utils/parse.build.config');
// const config = parse('config-build.js');
//
// {
//   paths: {
//     nuc: 'empty:',
//     csui: '.'
//   }
// }

'use strict';

var { readFileSync } = require('fs');

const configs = new Map();

function parseFile(fileContents) {
  // just remember the object passed to require.config
  // eslint-disable-next-line no-unused-vars
  const require = {
    config: object => (config = object)
  };
  // perform the require.config statement from the file source
  let config;
  eval(fileContents);
  return config;
}

module.exports = function (filePath) {
  let config = configs.get(filePath);
  if (config) {
    return config;
  }
  const fileContents = readFileSync(filePath, 'utf-8');
  config = parseFile(fileContents);
  if (!config) {
    throw new Error(`Parsing "${filePath}" failed.`);
  }
  configs.set(filePath, config);
  return config;
};
