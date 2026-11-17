/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const yeoman = require("yeoman-environment"), logger = require("./logger"), chalk = require("chalk"), _ = require("lodash");

const env = yeoman.createEnv(), generators = env.lookup({
  localOnly: true
});

let genMap = {};

generators.forEach(generator => {
  let nameSapce = generator.namespace;
  genMap[nameSapce] = true;
  logger.debug(`Discovered generator ${nameSapce} at package path ${generator.packagePath}`);
});

module.exports = function runGenerator(generatorName, options = {}) {
  genMap[generatorName] && env.run(generatorName, _.defaults({}, {
    "skip-install": true,
    force: true
  }));
};