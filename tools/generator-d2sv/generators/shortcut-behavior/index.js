/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), path = require("path"), _ = require("../../shared/lodash-complete"), yosay = require("yosay"), chalk = require("chalk");

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
      if (this.selfInvocation && this.skipIntro !== true) {
        this.log(yosay(`You're just a few questions away from adding a new ${chalk.red("Behavior")} for a shortcut !`));
      }
      let prompts = [ {
        type: "list",
        name: "plugin",
        message: "This shortcut goes to plugin:",
        choices: Object.keys(this.pluginMap),
        default: () => {
          let lastUsedArtifactId = this.config.getPath("shortcutBehavior.plugin") || this.config.getPath("shortcut.plugin") || this.config.get("pluginArtifactId");
          if (lastUsedArtifactId && this.pluginMap[lastUsedArtifactId]) {
            return lastUsedArtifactId;
          }
        },
        when: answers => {
          if (!this.prompts["plugin"]) {
            return true;
          }
          answers["plugin"] = this.prompts["plugin"];
          return false;
        }
      }, {
        type: "confirm",
        name: "addMissingSVSupport",
        message: "Selected plugin does not seem to have D2SV UI support enabled, add it ?",
        when: answers => {
          if (_.isUndefined(this.prompts["addMissingSVSupport"])) {
            this.isPluginNameValid = this._validatePluginSelection(answers["plugin"]);
            return !this.isPluginNameValid;
          }
          answers["addMissingSVSupport"] = this.prompts["addMissingSVSupport"];
          this.isPluginNameValid = this._validatePluginSelection(answers["plugin"]);
          return false;
        }
      }, {
        type: "input",
        name: "type",
        message: "Type of the target shortcut:",
        when: answers => {
          if (!this.prompts["type"]) {
            return this.isPluginNameValid || answers["addMissingSVSupport"];
          }
          answers["type"] = this.prompts["type"];
          return false;
        },
        default: () => {
          return this.config.getPath("shortcutBehavior.type") || this.config.getPath("shortcut.type");
        },
        validate: this._validateAlphaNumericNonLeadingNumberValue
      } ];
      this.prompts = await this.prompt(prompts);
    }
  }
  configuring() {
    this.config.set("shortcutBehavior", this.prompts);
  }
  default() {
    if (!Object.keys(this.pluginMap).length) {
      return;
    }
    if (this.selfInvocation && this.prompts["addMissingSVSupport"] === true) {
      this.prompts["overwriteSmartview"] = true;
      this.composeWith(require.resolve("../app-sv"), {
        prompts: this.prompts
      });
    }
    if (this.isPluginNameValid || this.prompts["addMissingSVSupport"]) {
      this.composeWith(require.resolve("../shortcut-behavior-writer"), {
        prompts: this.prompts
      });
    }
  }
  end() {
    if (!Object.keys(this.pluginMap).length) {
      this.log(yosay(chalk.redBright("Please create a plugin project first")));
      return;
    }
  }
};