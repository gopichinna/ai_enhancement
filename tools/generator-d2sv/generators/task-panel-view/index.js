/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), yosay = require("yosay"), chalk = require("chalk"), _ = require("../../shared/lodash-complete");

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
          message: "Select plugin to add new task details view",
          choices: _.values(this.pluginMap).map(p => ({
            name: `${p.desc || p.name} (${p.name})`,
            value: p.name
          }))
        }, {
          type: "input",
          name: "viewName",
          message: "Enter name for the view(alpha-numeric only):",
          validate: (value, answers) => {
            if (!_.isEmpty(value) && !this._validateName(value)) {
              return `Can only have alpha-numeric characters along with '_' & '-'`;
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
    return /^[0-9a-zA-Z_-]+$/.test(value);
  }
  configuring() {
    this.config.set("shortcut", this.prompts);
  }
  default() {
    if (!Object.keys(this.pluginMap).length) {
      return;
    }
    this.composeWith(require.resolve("../task-panel-view-writer"), {
      prompts: this.prompts
    });
  }
  end() {
    if (!this.selfInvocation) {
      return;
    }
    if (!Object.keys(this.pluginMap).length) {
      this.log(yosay(chalk.redBright("Please create a plugin project first")));
      return;
    }
    this.log(yosay(`Added new task details view to ${chalk.greenBright(this.prompts["plugin"])}.`));
  }
};