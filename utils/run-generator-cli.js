/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const {
  Command,
  Option,
  Argument
} = require("commander"), program = new Command(), runGenerator = require("./run-generator"), logger = require("./logger"), chalk = require("chalk");

program.version(require("../package.json").version).allowUnknownOption().addArgument(new Argument("[generator]", "Name of the generator to run").choices([ "samples", "interface", "run-doc", "run-build" ]).default("interface", "Shows workspace assistant")).action(generator => {
  logger.debug(`Running generator ${chalk.greenBright(generator)}`);
  runGenerator(`d2sv:${generator}`);
});

program.parse();