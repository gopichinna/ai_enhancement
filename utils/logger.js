/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const {
  createLogger,
  format,
  transports
} = require("winston"), {
  combine,
  timestamp,
  label,
  printf
} = format, {
  Command,
  Option
} = require("commander"), program = new Command();

program.version(require("../package.json").version).addOption(new Option("-ll, --loglevel <level>", "Set desired loggin level").choices([ "debug", "verbose", "info", "warn", "error", "silent" ]).default("info")).allowUnknownOption().allowExcessArguments(true);

program.parse();

const [ logLevel, silent ] = program.opts().loglevel === "silent" ? [ "info", true ] : [ program.opts().loglevel, false ];

const logger = createLogger({
  level: logLevel,
  exitOnError: false
});

logger.add(new transports.Console({
  format: combine(format(info => {
    info.level = info.level.toUpperCase();
    return info;
  })(), format.colorize(), format.simple())
}));

logger.transports.forEach(t => t.silent = silent);

module.exports = logger;