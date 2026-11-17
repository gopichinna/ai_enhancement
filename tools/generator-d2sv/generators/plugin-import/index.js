/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), yosay = require("yosay"), chalk = require("chalk"), os = require("os"), _ = require("../../shared/lodash-complete");

const path = require("path");

module.exports = class extends BaseModuleGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.skipIntro = opts.skipIntro;
    this.prompts = _.clone(opts.prompts || {});
    this.selfInvocation = _.isEmpty(this.prompts);
  }
  async initializing() {
    await super.initializing();
    this.lastPluginsDirectory = this.config.get("pluginsDirectory");
    if (!_.isString(this.lastPluginsDirectory) || _.isEmpty(this.lastPluginsDirectory)) {
      this.lastPluginsDirectory = "plugins";
    }
  }
  async prompting() {
    if (this.selfInvocation) {
      let prompts = [ {
        type: "input",
        name: "importPluginPath",
        message: "Enter plugin root path(Ex. " + os.homedir() + "\\plugin-project\\plugin1):",
        validate: value => {
          if (!this._validateDirPath(value)) {
            return `Path should be in valid format`;
          }
          if (!this._isSourcePluginExist(value)) {
            return `Entered path ${value} is invalid.Please make sure the plugin exists.`;
          }
          return true;
        }
      }, {
        type: "input",
        name: "pluginsDirectory",
        message: "Directory name to save imported plugin project in WS (default plugins):",
        default: this.lastPluginsDirectory,
        validate: value => {
          if (!this._validateName(value)) {
            return `Directory name should be in valid format`;
          }
          return true;
        }
      } ];
      let answers = await this.prompt(prompts);
      _.extend(this.prompts, answers);
    }
  }
  writing() {
    let pluginImpName = this._getPluginName(this.prompts["importPluginPath"]);
    if (Object.keys(this.pluginMap).length && this._isPluginExist(this.prompts["pluginsDirectory"], pluginImpName)) {
      return;
    }
    let options = [ "com.opentext.d2.sdk:d2sdk-maven-plugin:import-plugin-ws", `-DpluginSourceLocation=${this.prompts["importPluginPath"]}`, `-DpluginsDirName=${this.prompts["pluginsDirectory"]}` ];
    this.spawnCommandSync("mvn", options);
  }
  end() {
    if (!this.selfInvocation) {
      return;
    }
    let pluginImpName = this._getPluginName(this.prompts["importPluginPath"]);
    let isPluginExist = this._isPluginExist(this.prompts["pluginsDirectory"], pluginImpName);
    if (Object.keys(this.pluginMap).length && isPluginExist) {
      this.log(yosay(chalk.redBright(`${pluginImpName} already exist please remove it first`)));
      return;
    }
    this.log(yosay(`You've just Imported ${chalk.greenBright(pluginImpName)}.`));
  }
  _validateName(value) {
    return /^[0-9a-zA-Z_-]+$/.test(value);
  }
  _validateDirPath(value) {
    if (value.length === 0) {
      return false;
    }
    return /^([a-zA-Z]:\\|\\)?([a-zA-Z0-9_\-\. ]+\\)*[a-zA-Z0-9_\-\. ]*$/.test(value);
  }
  _isPluginExist(targetPluginDirectory, pluginImpName) {
    const cwd = process.cwd(), pluginDir = path.join(cwd, targetPluginDirectory, pluginImpName, "pom.xml");
    return this.fs.exists(pluginDir);
  }
  _isSourcePluginExist(pluginImpPath) {
    const pluginDir = path.join(pluginImpPath, "pom.xml");
    return this.fs.exists(pluginDir);
  }
  _getPluginName(pluginImpPath) {
    let importPath = pluginImpPath.split("\\");
    return importPath[importPath.length - 1].trim();
  }
};