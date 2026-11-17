/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const Generator = require("yeoman-generator");

const chalk = require("chalk");

const fs = require("fs");

const path = require("path");

const yosay = require("yosay");

const _ = require("../../shared/lodash-complete");

const nsGenerator = require("../../shared/plugin.namesapce.generator");

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.skipIntro = opts.skipIntro;
    this.prompts = _.clone(opts.prompts || {});
    this.selfInvocation = _.isEmpty(this.prompts);
  }
  initializing() {
    let npmHome = this.config.get("npmHome") || process.env["NPM_HOME"];
    if (!npmHome) {
      npmHome = process.execPath;
      let indexLastSlash = npmHome.lastIndexOf(path.sep);
      if (indexLastSlash > 0) {
        npmHome = npmHome.substring(0, indexLastSlash);
      }
    }
    if (this._validateNpmHome(npmHome)) {
      this.validatedNpmHome = npmHome;
    }
    let pluginsGroupId = this.config.get("pluginsGroupId");
    if (_.isString(pluginsGroupId) && !_.isEmpty(pluginsGroupId)) {
      this.validatedPluginsGroupId = pluginsGroupId;
    }
    this.lastPluginsDirectory = this.config.get("pluginsDirectory");
    if (!_.isString(this.lastPluginsDirectory) || _.isEmpty(this.lastPluginsDirectory)) {
      this.lastPluginsDirectory = "plugins";
    }
    this.lastPluginVersion = this.config.get("pluginVersion");
    if (!this._validateVersion(this.lastPluginVersion)) {
      this.lastPluginVersion = "1.0.0";
    }
  }
  _validateNpmHome(npmHome) {
    if (fs.existsSync(npmHome)) {
      let npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
      if (fs.existsSync(path.join(npmHome, npmCmd))) {
        return true;
      }
    }
    return false;
  }
  _validateVersion(version) {
    return /(\d+\.){2}\d+$/.test(version);
  }
  _validateArtifactId(value) {
    return value.length === 1 && /^[a-zA-Z_]/.test(value) || /^[a-zA-Z_][0-9a-zA-Z_-]*[0-9a-zA-Z_]+$/.test(value);
  }
  async prompting() {
    if (this.selfInvocation) {
      if (this.skipIntro !== true) {
        this.log(yosay(`Welcome to the ${chalk.red("D2SV Plugin project")} generator!`));
      }
      let prompts = [ {
        type: "input",
        name: "npmHome",
        message: "Directory of NodeJS installation:",
        default: this.validatedNpmHome,
        validate: value => {
          let retVal = this._validateNpmHome(value);
          if (!retVal) {
            return "Invalid directory, please provide correct location of NodeJS installation";
          }
          return true;
        },
        when: !this.validatedNpmHome
      }, {
        type: "input",
        name: "pluginsDirectory",
        message: "Directory name to save this plugin project in:",
        default: this.lastPluginsDirectory
      }, {
        type: "input",
        name: "pluginsGroupId",
        message: "Maven group-id of the plugin" + (this.validatedPluginsGroupId !== undefined ? "" : "[Example: com.opentext.test]") + ":",
        default: this.validatedPluginsGroupId,
        validate: value => {
          if (!value) {
            return "Maven group-id is required";
          }
          return value.length === 1 && /^[_a-z]/.test(value) || /^[_a-z]([\._a-z0-9]*)([a-z0-9_]+$)/.test(value);
        }
      }, {
        type: "input",
        name: "pluginArtifactId",
        message: "Name(maven artifact-id) of the plugin:",
        validate: (value, answers) => {
          if (!this._validateArtifactId(value)) {
            return `Name can only have alpha-numeric characters along with '_' & '-' and plugin name should not start with a number`;
          }
          let pDir = answers["pluginsDirectory"];
          if (fs.existsSync(path.join(process.cwd(), pDir, value))) {
            return `Plugin by the name '${value}' already exists, please use a different name`;
          }
          return true;
        }
      }, {
        type: "input",
        name: "pluginVersion",
        message: "Version of the plugin:",
        default: this.lastPluginVersion,
        validate: (value, answers) => {
          let valid = this._validateVersion(value);
          if (!valid) {
            return "Invalid version, please specify something of the format <major>.<minor>.<patch>";
          }
          return true;
        }
      }, {
        type: "input",
        name: "pluginDesc",
        message: "One liner description of the plugin(shows up everywhere in D2 runtime):",
        default: answers => {
          return answers["pluginArtifactId"];
        }
      }, {
        type: "input",
        name: "pluginPackage",
        message: "Enter package namespace for the plugin(used as prefix/suffix to generate Java classes & properties, also its lowercase format is used as base Java package name for the plugin & D2SV UI bundle):",
        default: answers => {
          return nsGenerator.getPluginPackageNameFromArtifactId(answers["pluginArtifactId"]);
        }
      }, {
        type: "confirm",
        name: "includeSVSupport",
        message: "Include support for D2SV UI:",
        default: true
      } ];
      this.prompts = await this.prompt(prompts);
    }
  }
  configuring() {
    this.config.set(this.prompts);
  }
  writing() {
    _.defaults(this.prompts, {
      pluginsGroupId: this.validatedPluginsGroupId,
      npmHome: this.validatedNpmHome
    });
    let options = [ "com.opentext.d2.sdk:d2sdk-maven-plugin:create-plugin", `-DpluginsDirName=${this.prompts["pluginsDirectory"]}`, `-DpluginsGroupId=${this.prompts["pluginsGroupId"]}`, `-DpluginArtifactId=${this.prompts["pluginArtifactId"]}`, `-DpluginVersion=${this.prompts["pluginVersion"]}`, `-DpluginName=${this.prompts["pluginDesc"]}`, `-DpluginPackage=${this.prompts["pluginPackage"]}`, `-DnpmHome=${this.prompts["npmHome"]}` ];
    if (this.prompts["extractSample"] === true) {
      options.push(`-DextractSample=true`);
    }
    this.spawnCommandSync("mvn", options);
    if (this.prompts["includeSVSupport"] === true) {
      this.prompts["plugin"] = this.prompts["pluginArtifactId"];
      this.prompts["overwriteSmartview"] = true;
      this.composeWith(require.resolve("../app-sv"), {
        prompts: this.prompts
      });
    }
  }
  end() {
    const cwd = process.cwd(), pluginDir = path.join(cwd, this.prompts["pluginsDirectory"], this.prompts["pluginArtifactId"]);
    this.spawnCommandSync("mvn", [ "clean", "initialize" ], {
      cwd: pluginDir
    });
    if (this.selfInvocation) {
      this.log(yosay(`You've just created ${chalk.greenBright(`${this.prompts["pluginDesc"]} (${this.prompts["pluginArtifactId"]}) - ${this.prompts["pluginVersion"]}`)} plugin!`));
    }
  }
};