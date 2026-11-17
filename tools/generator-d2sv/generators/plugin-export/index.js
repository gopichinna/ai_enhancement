/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), yosay = require("yosay"), chalk = require("chalk"), os = require("os"), _ = require("../../shared/lodash-complete");

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
          message: "Select plugin to export:",
          choices: _.values(this.pluginMap).map(p => ({
            name: `${p.desc || p.name} (${p.name})`,
            value: p.name
          }))
        }, {
          type: "input",
          name: "exportLocation",
          message: "Enter path for export (default " + os.homedir() + "\\plugin-project):",
          default: os.homedir() + "\\plugin-project",
          validate: value => {
            if (!this._validateName(value)) {
              return `Path should be in valid format`;
            }
            return true;
          }
        } ];
        let answers = await this.prompt(prompts);
        _.extend(this.prompts, answers);
      }
    }
  }
  _validateName(value) {
    if (value.length === 0) {
      return false;
    }
    return /^([a-zA-Z]:\\|\\)?([a-zA-Z0-9_\-\. ]+\\)*[a-zA-Z0-9_\-\. ]*$/.test(value);
  }
  writing() {
    if (!Object.keys(this.pluginMap).length) {
      return;
    }
    let module = this.pluginMap[this.prompts["plugin"]].module;
    let name = this.pluginMap[this.prompts["plugin"]].name;
    let options = [ "com.opentext.d2.sdk:d2sdk-maven-plugin:export-plugin", `-DpluginsModule=${module}`, `-DpluginName=${name}`, `-DexportLocation=${this.prompts["exportLocation"]}` ];
    this.spawnCommandSync("mvn", options);
  }
  end() {
    if (!this.selfInvocation) {
      return;
    }
    if (!Object.keys(this.pluginMap).length) {
      this.log(yosay(chalk.redBright("Please create a plugin project first")));
      return;
    }
    this.log(yosay(`Exported ${chalk.greenBright(this.prompts["plugin"])}.`));
  }
};