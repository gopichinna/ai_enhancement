/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), yosay = require("yosay"), chalk = require("chalk"), _ = require("../../shared/lodash-complete"), {
  join
} = require("path"), {
  rmdirSync
} = require("fs-extra");

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
  async prompting() {
    if (Object.keys(this.pluginMap).length) {
      if (this.selfInvocation) {
        let prompts = [ {
          type: "list",
          name: "plugin",
          message: "Select plugin to remove from workspace:",
          choices: _.values(this.pluginMap).map(p => ({
            name: `${p.desc || p.name} (${p.name})`,
            value: p.name
          }))
        }, {
          type: "confirm",
          name: "removeCompletely",
          message: "Remove it completely from file system ?",
          default: false,
          when: answers => {
            if (_.isUndefined(this.prompts["removeCompletely"])) {
              return true;
            }
          }
        } ];
        let answers = await this.prompt(prompts);
        _.extend(this.prompts, answers);
      }
    }
  }
  writing() {
    if (!Object.keys(this.pluginMap).length) {
      return;
    }
    if (this.prompts["removeCompletely"]) {
      const namespace = this.pluginMap[this.prompts["plugin"]].namespace;
      [ "src", "debug", "release" ].forEach(d => {
        rmdirSync(join(process.cwd(), "lib", d, namespace));
      });
    }
    let module = this.pluginMap[this.prompts["plugin"]].module;
    let options = [ "com.opentext.d2.sdk:d2sdk-maven-plugin:remove-plugin", `-Dmodule=${module}`, `-DremoveCompletely=${this.prompts["removeCompletely"]}` ];
    this.spawnCommandSync("mvn", options);
  }
  end() {
    if (!this.selfInvocation) {
      return;
    }
    if (!Object.keys(this.pluginMap).length) {
      this.log(yosay(chalk.redBright("No plugin project found.")));
      return;
    }
    this.log(yosay(`Removed ${chalk.greenBright(this.prompts["plugin"])} from workspace.`));
  }
};