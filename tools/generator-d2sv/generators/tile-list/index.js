/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseTileGenerator = require("../../shared/base.tile.generator"), path = require("path"), yosay = require("yosay"), chalk = require("chalk"), _ = require("../../shared/lodash-complete");

module.exports = class extends BaseTileGenerator {
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
        this.log(yosay(`You're just a few questions away from adding a new ${chalk.red("List tile")} !`));
      }
      let prompts = [ {
        type: "list",
        name: "plugin",
        message: "This shortcut goes to plugin:",
        choices: Object.keys(this.pluginMap),
        default: () => {
          let lastUsedArtifactId = this.config.getPath("listTile.plugin") || this.config.get("pluginArtifactId");
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
        message: "Name of Widget type to associate (E.g. FavoritesWidget, RecentlyAccessedWidget etc.):",
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
        type: "input",
        name: "srcDir",
        message: "Directory name where generated code will be put into:",
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        },
        default: answers => {
          return this._deduceName(answers["type"]);
        },
        validate: this._validateFileNamingConvention
      }, {
        type: "input",
        name: "defaultTitle",
        message: "Default title of this tile:",
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        },
        default: answers => answers["type"],
        validate: this._validateAlphaNumericNonLeadingNumberValue
      }, {
        type: "input",
        name: "description",
        message: "How would you describe this tile?",
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        }
      }, {
        type: "confirm",
        name: "hasApplicationScope",
        message: "Will it expand to own perspective?",
        default: true,
        when: answers => {
          return this.isPluginNameValid || answers["addMissingSVSupport"];
        }
      }, {
        type: "input",
        name: "applicationScope",
        message: "Perspective's application scope:",
        when: answers => {
          return (this.isPluginNameValid || answers["addMissingSVSupport"]) && answers["hasApplicationScope"] === true;
        },
        validate: this._validateAlphaNumericNonLeadingNumberValue
      }, {
        type: "confirm",
        name: "addAppScope",
        message: "Would you like to add the perspective as well?",
        when: answers => {
          return (this.isPluginNameValid || answers["addMissingSVSupport"]) && answers["hasApplicationScope"] === true;
        },
        default: true
      } ];
      this.prompts = await this.prompt(prompts);
    }
  }
  configuring() {
    this.config.set("listTile", this.prompts);
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
      if (this.prompts["hasApplicationScope"]) {
        this.prompts["behavior"] = "perspective";
      }
      this.prompts["hasWidgetConfig"] = true;
      const namespace = this.pluginMap[this.prompts["plugin"]].namespace;
      this.prompts["tileViewPath"] = `${namespace}/widgets/${this.prompts["srcDir"]}`;
      this.composeWith(require.resolve("../tile-writer"), {
        prompts: this.prompts
      });
      this.composeWith(require.resolve("../tile-list-writer"), {
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