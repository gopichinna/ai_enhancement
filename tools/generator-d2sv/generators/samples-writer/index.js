/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), path = require("path"), _ = require("../../shared/lodash-complete"), yosay = require("yosay"), chalk = require("chalk");

module.exports = class extends BaseModuleGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = _.clone(opts.prompts || {});
    this.selfInvocation = _.isEmpty(this.prompts);
  }
  async initializing() {
    await super.initializing();
  }
  configuring() {
    this.config.set("samplesw", this.prompts);
  }
  install() {
    if (!this.selfInvocation) {
      try {
        const sampleMetaPath = this.templatePath(path.join(this.prompts["sampleId"], "meta.json"));
        const sampleMetaJson = this.fs.readJSON(sampleMetaPath);
        this.prompts["samplesMetadata"] = sampleMetaJson || {};
      } catch (e) {
        this.prompts["samplesMetadata"] = {};
      }
      this.prompts["namespace"] = this.prompts["namespace"] || this.pluginMap[this.prompts["plugin"]].namespace;
      this._writeBundle(this.prompts);
      this._writeExtension(this.prompts);
      this._writeTemplates(this.prompts);
    }
  }
  _writeBundle(options = {}) {
    const plugin = options.plugin, namespace = options.namespace, sampleId = options.sampleId;
    const srcBundlePath = this.templatePath(path.join(sampleId, "bundle.json"));
    if (this.fs.exists(srcBundlePath)) {
      try {
        const bundleJSON = this.fs.readJSON(srcBundlePath);
        const bundles = bundleJSON && _.isArray(bundleJSON.bundle) ? bundleJSON.bundle : [];
        bundles.forEach(b => {
          const bundleNameparts = b.split("!");
          const modIndex = bundleNameparts.length > 1 ? 1 : 0;
          bundleNameparts[modIndex] = `${namespace}/${bundleNameparts[modIndex]}`;
          const bundleEntryPath = bundleNameparts.join("!");
          this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
            path: bundleEntryPath
          } ]);
        });
      } catch (e) {}
    }
  }
  _writeExtension(options = {}) {
    const plugin = options.plugin, namespace = options.namespace, sampleId = options.sampleId;
    const srcExtPath = this.templatePath(path.join(sampleId, "extension.json"));
    if (this.fs.exists(srcExtPath)) {
      try {
        const extJSON = this.fs.readJSON(srcExtPath);
        Object.keys(extJSON).forEach(extKey => {
          const extensions = extJSON[extKey];
          extensions.forEach(ext => {
            this._addToExtensionJson(plugin, namespace, extKey, `${namespace}/${ext}`);
          });
        });
      } catch (e) {}
    }
  }
  _writeTemplates(options = {}) {
    const plugin = options.plugin, namespace = options.namespace, sampleId = options.sampleId, templatePath = this.templatePath(path.join(sampleId, "smartview"));
    this._walkAllFiles(templatePath, fInfo => {
      const destFilePath = path.join(this.pluginMap[plugin]["srcPath"], fInfo.relativeDirPath, fInfo.fileName);
      this.fs.copyTpl(fInfo.filePath, this.destinationPath(destFilePath), options);
    });
  }
  end() {
    if (this.selfInvocation) {
      this.log(yosay(`I'm not meant to be invoked independently!`));
    } else {
      this.log(yosay(`Successfully extracted sample: ${chalk.greenBright(this.prompts.sampleName)}`));
      const finishInstruction = this.prompts["samplesMetadata"].finishInstruction;
      if (_.isString(finishInstruction) && !_.isEmpty(finishInstruction)) {
        this.log(yosay(`${chalk.cyanBright(finishInstruction)}`));
      }
    }
  }
};