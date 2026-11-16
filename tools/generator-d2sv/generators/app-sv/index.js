/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), path = require("path"), {
  Parser
} = require("xml2js"), parser = new Parser(), yosay = require("yosay"), chalk = require("chalk"), _ = require("../../shared/lodash-complete"), nsGenerator = require("../../shared/plugin.namesapce.generator");

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
        this.log(yosay(`You're just a questions away from enabling ${chalk.red("D2SV UI features")} in your plugin !`));
      }
      let prompts = [ {
        type: "list",
        name: "plugin",
        message: "Add D2SV UI to plugin:",
        choices: Object.keys(this.pluginMap),
        default: () => {
          let lastUsedArtifactId = this.config.getPath("sv.plugin") || this.config.get("pluginArtifactId");
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
        name: "overwriteSmartview",
        message: "Selected plugin seems to have D2SV UI support enabled already, overwrite it ?",
        default: false,
        when: answers => {
          this.smartViewExists = this._validatePluginSelection(answers["plugin"]);
          if (_.isUndefined(this.prompts["overwriteSmartview"])) {
            return this.smartViewExists;
          }
          answers["overwriteSmartview"] = this.prompts["overwriteSmartview"];
          return false;
        }
      } ];
      let answers = await this.prompt(prompts);
      _.extend(this.prompts, answers);
    }
  }
  configuring() {
    this.config.set("sv", this.prompts);
  }
  async writing() {
    if (!Object.keys(this.pluginMap).length || this.smartViewExists && !this.prompts["overwriteSmartview"]) {
      return;
    }
    const pluginPath = this.pluginMap[this.prompts["plugin"]].pluginPath;
    if (!this.prompts["pluginName"] || !this.prompts["pluginVersion"]) {
      try {
        const pomContent = this.fs.read(path.join(pluginPath, "pom.xml"));
        const pomJson = await parser.parseStringPromise(pomContent);
        this.prompts["pluginVersion"] = this.prompts["pluginVersion"] || pomJson.project.version;
        this.prompts["pluginName"] = this.prompts["pluginName"] || pomJson.project.name || pomJson.project.artifactId;
      } catch (e) {
        this.errorMsg = `Corrupted plugin ${chalk.red(this.prompts["plugin"])}, pom.xml not found. Please create a fresh plugin or select a different one.`;
        return;
      }
    }
    this.prompts["relativeWorkspacePath"] = path.relative(pluginPath, this.destinationRoot()).replace(/\\/g, "/");
    this.prompts["namespace"] = this.pluginMap[this.prompts["plugin"]].namespace;
    if (this.prompts["pluginPackage"]) {
      this.prompts["namespace"] = nsGenerator.getPluginNSFromPackageName(this.prompts["pluginPackage"]);
    }
    this.prompts["d2_version"] = this.d2Version;
    this._addD2SVUI(this.prompts);
  }
  _addD2SVUI(options = {}) {
    this._copyD2SVUIArtifacts(options, "resources", "resourcePath");
    this._copyD2SVUIArtifacts(options, "smartview", "svPath");
  }
  _copyD2SVUIArtifacts(options = {}, templateBasePath, targetBasePathProperty) {
    const namespace = options["namespace"], plugin = options["plugin"];
    this._walkAllFiles(this.templatePath(templateBasePath), fInfo => {
      const destFileName = fInfo.fileName.replace(/namespace/g, namespace);
      const destFilePath = path.join(this.pluginMap[plugin][targetBasePathProperty], fInfo.relativeDirPath, destFileName);
      this.fs.copyTpl(fInfo.filePath, this.destinationPath(destFilePath), options);
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
    if (this.smartViewExists && !this.prompts["overwriteSmartview"]) {
      this.log(yosay(chalk.redBright("Didn't add D2SV UI since already existed. Please specify the overwrite options if desired.")));
      return;
    }
    if (this.errorMsg) {
      this.log(yosay(this.errorMsg));
      return;
    }
    this.log(yosay(`Added D2SV UI support to ${chalk.greenBright(this.prompts["plugin"])}`));
  }
};