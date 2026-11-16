/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const cwd = __dirname, {
  spawn,
  execFile
} = require("child_process"), path = require("path"), {
  ensureSymlink,
  existsSync
} = require("fs-extra"), chalk = require("chalk"), logger = require("./logger");

function checkDirOrGetDefaultCwd(dir) {
  return existsSync(dir) ? dir : process.cwd();
}

async function execCmd(fullCmd, dir) {
  dir = checkDirOrGetDefaultCwd(dir);
  logger.debug(`Running ${chalk.cyan(fullCmd)} in ${chalk.cyan(path.resolve(dir))}...`);
  return new Promise((resolve, reject) => {
    const [ cmd, ...cmdRest ] = !!fullCmd ? fullCmd.split(" ") : [ "echo", "hello world!" ], proc = spawn(cmd, [].concat(cmdRest), {
      cwd: dir,
      shell: true
    }).on("error", e => {
      reject(1);
    }).on("close", code => {
      if (code) {
        logger.error(`${chalk.red(fullCmd)} failed`);
        reject(code);
        return;
      }
      resolve(code);
    });
    proc.stdout.on("data", data => process.stdout.write(data.toString()));
    proc.stderr.on("data", data => process.stderr.write(data.toString()));
  });
}

function ensureDirectoryLink(source, target) {
  logger.debug(`Ensuring sym-link ${chalk.cyan(source)} -> ${chalk.cyan(target)}`);
  ensureSymlink(source, target, "junction");
}

module.exports = {
  execCmd: execCmd,
  ensureDirectoryLink: ensureDirectoryLink
};