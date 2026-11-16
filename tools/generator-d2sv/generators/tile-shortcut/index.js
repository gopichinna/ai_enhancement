/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), yosay = require("yosay"), chalk = require("chalk"), _ = require("../../shared/lodash-complete");

module.exports = class extends BaseModuleGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.skipIntro = opts.skipIntro;
  }
  async initializing() {
    await super.initializing();
  }
  async prompting() {
    if (Object.keys(this.pluginMap).length) {
      if (this.skipIntro !== true) {
        this.log(yosay(`You're just a few questions away from adding a new ${chalk.red("Shortcut tile")} !`));
      }
      let prompts = [ {
        type: "list",
        name: "plugin",
        message: "This shortcut goes to plugin:",
        choices: Object.keys(this.pluginMap),
        default: () => {
          let lastUsedArtifactId = this.config.getPath("shortcut.plugin") || this.config.get("pluginArtifactId");
          if (lastUsedArtifactId && this.pluginMap[lastUsedArtifactId]) {
            return lastUsedArtifactId;
          }
        }
      }, {
        type: "confirm",
        name: "addMissingSVSupport",
        message: "Selected plugin does not seem to have D2SV UI support enabled, add it ?",
        when: answers => {
          this.isPluginNameValid = this._validatePluginSelection(answers["plugin"]);
          return !this.isPluginNameValid;
        }
      }, {
        type: "input",
        name: "type",
        message: 'Type of this shortcut(Refer "Add smartview shortcut tile" in documentation for more details ):',
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        },
        validate: this._validateAlphaNumericNonLeadingNumberValue
      }, {
        type: "input",
        name: "iconClassName",
        message: "CSS class name for the icon:",
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        },
        validate: this._validateCssClassName
      }, {
        type: "confirm",
        name: "hasWidgetConfig",
        message: "Does it require a widget config ?",
        default: false,
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        }
      }, {
        type: "list",
        name: "behavior",
        message: "What this shortcut should do on click?",
        choices: [ {
          name: "Execute inline handler",
          value: "handler"
        }, {
          name: "Execute a behavior",
          value: "behavior"
        }, {
          name: "Expand to perspective",
          value: "perspective"
        } ],
        default: "handler",
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        }
      }, {
        type: "input",
        name: "applicationScope",
        message: "Perspective's application scope:",
        when: answers => {
          return (this.isPluginNameValid || answers["addMissingSVSupport"]) && answers["behavior"] === "perspective";
        },
        validate: this._validateAlphaNumericNonLeadingNumberValue
      }, {
        type: "confirm",
        name: "addAppScope",
        message: "Would you like to add the perspective as well?",
        when: answers => {
          return (this.isPluginNameValid || answers["addMissingSVSupport"]) && answers["behavior"] === "perspective";
        },
        default: true
      } ];
      this.prompts = await this.prompt(prompts);
    }
  }
  configuring() {
    this.config.set("shortcut", this.prompts);
  }
  default() {
    if (!Object.keys(this.pluginMap).length) {
      return;
    }
    if (this.prompts["addMissingSVSupport"] === true) {
      this.prompts["overwriteSmartview"] = true;
      this.composeWith(require.resolve("../app-sv"), {
        prompts: this.prompts
      });
    }
    if (this.isPluginNameValid || this.prompts["addMissingSVSupport"]) {
      this.prompts.isShortcut = true;
      this.composeWith(require.resolve("../tile-writer"), {
        prompts: this.prompts
      });
    }
    if (this.prompts.behavior === "behavior") {
      this.composeWith(require.resolve("../shortcut-behavior"), {
        prompts: this.prompts
      });
    }
    if (this.prompts["addAppScope"] === true) {
      this.composeWith(require.resolve("../app-scope"), {
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