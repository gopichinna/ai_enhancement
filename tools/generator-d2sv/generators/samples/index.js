/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
const Generator = require("yeoman-generator");

const chalk = require("chalk");

const fs = require("fs");

const path = require("path");

const yosay = require("yosay");

const _ = require("../../shared/lodash-complete");

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.skipIntro = opts.skipIntro;
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
    this.lastPluginsDirectory = this.config.get("pluginsDirectory");
    if (!_.isString(this.lastPluginsDirectory) || _.isEmpty(this.lastPluginsDirectory)) {
      this.lastPluginsDirectory = "plugins";
    }
    this.commonOptions = {
      npmHome: this.validatedNpmHome,
      pluginsDirectory: this.lastPluginsDirectory
    };
    const genRootDir = path.resolve(path.join(this.templatePath(), "../.."));
    const samplesRootDir = path.resolve(path.join(genRootDir, "samples-writer", "templates"));
    const files = fs.readdirSync(samplesRootDir), samplesMap = {};
    let hasSamples = false;
    files.forEach(file => {
      const dirPath = path.join(samplesRootDir, file);
      if (fs.statSync(dirPath).isDirectory()) {
        try {
          const metaJSON = this.fs.readJSON(path.join(dirPath, "meta.json"));
          const descriptors = _.isArray(metaJSON.descriptors) ? metaJSON.descriptors : [];
          if (descriptors.every(d => fs.existsSync(path.join(genRootDir, d.name)))) {
            samplesMap[file] = {
              id: file,
              name: metaJSON.name,
              dirPath: dirPath,
              metadata: metaJSON
            };
            hasSamples = true;
          }
        } catch (e) {}
      }
    });
    this.samplesMap = samplesMap;
    this.hasSamples = hasSamples;
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
  async prompting() {
    if (this.hasSamples) {
      if (this.skipIntro !== true) {
        this.log(yosay(`You can take a look at one of our packaged samples!`));
      }
      let prompts = [ {
        type: "list",
        name: "sampleId",
        message: "Pick the sample you want:",
        choices: _.values(this.samplesMap).map(s => ({
          name: s.name,
          value: s.id
        }))
      } ];
      this.prompts = await this.prompt(prompts);
    }
  }
  configuring() {
    this.config.set("samples", this.prompts);
  }
  writing() {
    const sample = this.samplesMap[this.prompts["sampleId"]];
    if (!!sample) {
      const descriptors = sample.metadata.descriptors;
      descriptors.forEach(d => {
        this.commonOptions = _.defaults(this.commonOptions, this.prompts, {
          sampleName: sample.name
        }, d.properties);
        this.commonOptions["plugin"] = this.commonOptions["plugin"] || this.commonOptions["pluginArtifactId"];
        this.commonOptions["extractSample"] = true;
        this.composeWith(require.resolve(`../${d.name}`), {
          prompts: this.commonOptions
        });
      });
    }
  }
  install() {
    this.composeWith(require.resolve(`../samples-writer`), {
      prompts: this.commonOptions
    });
  }
  end() {
    if (!this.hasSamples) {
      this.log(yosay(`Sorry! no samples yet`));
    }
  }
};