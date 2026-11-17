/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
// Returns an object parsed out of a module with its export entered
// as an object literal. Expects a script with the `define` statement.
//
// const parse = require('./utils/parse.object.module');
// const config = parse('nuc/models/node/impl/nls/lang.js');
//
// {
//   root: true,
//   'en-us': false,
//   en: false
// }

'use strict';

var { readFileSync } = require('fs');

const objects = new Map();

function parseModule(fileContents) {
  // just remember the module content, which is a JSON object
  // eslint-disable-next-line no-unused-vars
  function define(name, content) {
    result = typeof name === 'string' ? content : name;
  }
  // perform the define statement from the file source
  let result;
  eval(fileContents);
  return result;
}

module.exports = function (filePath) {
  let object = objects.get(filePath);
  if (object) {
    return object;
  }
  const fileContents = readFileSync(filePath, 'utf-8');
  object = parseModule(fileContents);
  if (!object) {
    throw new Error(`Parsing "${filePath}" failed.`);
  }
  objects.set(filePath, object);
  return object;
};
