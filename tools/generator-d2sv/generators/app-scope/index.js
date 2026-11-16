/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), path = require("path"), yosay = require("yosay"), chalk = require("chalk"), _ = require("../../shared/lodash-complete");

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
        this.log(yosay(`You're just a few questions away from adding a new ${chalk.red("Application scope perspective")} !`));
      }
      let prompts = [ {
        type: "list",
        name: "plugin",
        message: "This perspective goes to plugin:",
        choices: Object.keys(this.pluginMap),
        default: () => {
          let lastUsedArtifactId = this.config.getPath("appScope.plugin") || this.config.get("pluginArtifactId");
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
        message: "Name of Widget type to associate (E.g. FavoritesWidget, RecentlyAccessedWidget etc.):",
        when: answers => {
          if (!this.prompts["type"]) {
            return this.isPluginNameValid || answers["addMissingSVSupport"];
          }
          answers["type"] = this.prompts["type"];
          return false;
        },
        validate: this._validateAlphaNumericNonLeadingNumberValue
      }, {
        type: "input",
        name: "defaultType",
        message: "Name of the default smartview widget type(from landing config) to associate:",
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        },
        validate: value => {
          return _.isEmpty(value) || this._validateAlphaNumericNonLeadingNumberValue(value);
        }
      }, {
        type: "input",
        name: "applicationScope",
        message: "Application scope of this perspective(also used as URL fragment):",
        when: answers => {
          if (!this.prompts["applicationScope"]) {
            return this.isPluginNameValid || answers["addMissingSVSupport"];
          }
          answers["applicationScope"] = this.prompts["applicationScope"];
          return false;
        },
        validate: this._validateAlphaNumericNonLeadingNumberValue
      }, {
        type: "input",
        name: "srcDir",
        message: "Directory name where generated code will be put into:",
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        },
        default: answers => {
          return this._deduceName(answers["type"], "", "perspective");
        },
        validate: this._validateFileNamingConvention
      }, {
        type: "input",
        name: "defaultTitle",
        message: "Default title of this perspective:",
        when: answers => {
          if (!this.prompts["defaultTitle"]) {
            return this.isPluginNameValid || answers["addMissingSVSupport"];
          }
          answers["defaultTitle"] = this.prompts["defaultTitle"];
          return false;
        },
        default: answers => answers["type"],
        validate: this._validateAlphaNumericNonLeadingNumberValue
      }, {
        type: "input",
        name: "description",
        message: "How would you describe this perspective?",
        when: answers => {
          if (_.isUndefined(this.prompts["description"])) {
            return this.isPluginNameValid || answers["addMissingSVSupport"];
          }
          answers["description"] = this.prompts["description"];
          return false;
        }
      } ];
      let answers = await this.prompt(prompts);
      _.extend(this.prompts, answers);
    }
  }
  configuring() {
    this.config.set("appScope", this.prompts);
  }
  default() {
    if (this.selfInvocation && this.prompts["addMissingSVSupport"] === true) {
      this.prompts["overwriteSmartview"] = true;
      this.composeWith(require.resolve("../app-sv"), {
        prompts: this.prompts
      });
    }
    if (this.isPluginNameValid || this.prompts["addMissingSVSupport"]) {
      this.composeWith(require.resolve("../app-scope-writer"), {
        prompts: this.prompts
      });
    }
  }
  end() {
    if (!Object.keys(this.pluginMap).length) {
      this.log(yosay(chalk.redBright("Please create a plugin project first")));
    }
  }
};