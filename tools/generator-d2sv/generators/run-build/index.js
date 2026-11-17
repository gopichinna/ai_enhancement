/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const BaseModuleGenerator = require("../../shared/base.module.generator");

const chalk = require("chalk");

const fs = require("fs");

const path = require("path");

const yosay = require("yosay");

const _ = require("../../shared/lodash-complete");

module.exports = class extends BaseModuleGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.skipIntro = opts.skipIntro;
    this.prompts = _.clone(opts.prompts || {});
    this.selfInvocation = _.isEmpty(this.prompts);
  }
  async initializing() {
    await super.initializing();
  }
  end() {
    if (!this.selfInvocation) {
      return;
    }
    if (!Object.keys(this.pluginMap).length) {
      this.log(yosay(chalk.redBright("No plugin project found.")));
      return;
    }
    this.spawnCommand("mvn", [ "clean", "package" ]);
  }
};