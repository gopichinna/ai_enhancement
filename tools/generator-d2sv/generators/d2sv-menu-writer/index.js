/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseModuleGenerator = require("../../shared/base.module.generator"), path = require("path"), _ = require("../../shared/lodash-complete");

module.exports = class extends BaseModuleGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = _.clone(opts.prompts || {});
  }
  async initializing() {
    await super.initializing();
  }
  writing() {
    this.prompts["namespace"] = this.prompts["namespace"] || this.pluginMap[this.prompts["plugin"]].namespace;
    if (this.prompts["rType"] === "JS") {
      this._addCallbackJSFile(this.prompts);
    }
  }
  _addCallbackJSFile(options) {
    const plugin = options.plugin, namespace = options.namespace, actionfileName = options.rAction.split(":")[0], targetModuleRelativeToSrc = `actions/${actionfileName}`, targetModuleRelativeToSrcWithFileExtension = targetModuleRelativeToSrc + ".js";
    options.rActionFunctionName = options.rAction.split(":")[1];
    const actionFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    if (!this.fs.exists(actionFile)) {
      this.fs.copyTpl(this.templatePath("callback.action.file.js"), actionFile, options);
    }
    const extensionFilePath = `${namespace}/${targetModuleRelativeToSrc}`;
    this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
      path: extensionFilePath
    } ]);
  }
};