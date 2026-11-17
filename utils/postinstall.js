/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const cwd = process.cwd(), path = require("path"), chalk = require("chalk"), {
  execCmd
} = require("./utils"), logger = require("./logger");

(async () => {
  try {
    await execCmd("npm link --no-progress --no-audit --no-fund", path.join(cwd, "tools/generator-d2sv"));
    await execCmd("npm link --no-progress --no-audit --no-fund generator-d2sv");
  } catch (e) {
    logger.error(`${chalk.red(e.message)}`);
    process.exitCode = 1;
  }
})();