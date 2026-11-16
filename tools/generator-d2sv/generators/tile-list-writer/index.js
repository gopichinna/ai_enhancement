/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
"use strict";

const BaseTileGenerator = require("../../shared/base.tile.generator"), path = require("path"), _ = require("../../shared/lodash-complete");

module.exports = class extends BaseTileGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.prompts = _.clone(opts.prompts || {});
  }
  async initializing() {
    await super.initializing();
  }
  writing() {
    this._addListTile(this.prompts);
  }
  _addListTile(options = {}) {
    options["widget"] = options["srcDir"];
    options["typedNamePrefix"] = _.capitalize(options["type"]);
    options["typedModulePrefix"] = this._deduceName(options["type"]);
    options["namespace"] = options["namespace"] || this.pluginMap[options["plugin"]].namespace;
    const plugin = options["plugin"], namespace = options.namespace;
    const topLevelFiles = [ {
      moduleName: "widget.column.collection",
      srcRelativeTargetDir: "models/table"
    }, {
      moduleName: "widget.collection",
      srcRelativeTargetDir: "models"
    }, {
      moduleName: "widget.model",
      srcRelativeTargetDir: "models"
    }, {
      moduleName: "widget.collection.factory",
      srcRelativeTargetDir: "utils/contexts/factories"
    } ];
    topLevelFiles.forEach(t => {
      const destModuleName = t.moduleName.replace(/widget/g, options["typedModulePrefix"]);
      const srcRelativeDestModulePath = `${t.srcRelativeTargetDir}/${destModuleName}`;
      const destModulePath = `${namespace}/${srcRelativeDestModulePath}`;
      const destFile = this._getDestFile(plugin, srcRelativeDestModulePath);
      if (!this.fs.exists(destFile)) {
        this.fs.copyTpl(this.templatePath(`${t.moduleName}.js`), destFile, options);
      }
      this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
        path: destModulePath
      } ]);
    });
    const baseTemplatePath = this.templatePath("widget");
    this._walkAllFiles(baseTemplatePath, fInfo => {
      const destFileName = fInfo.fileName.replace(/widget/g, options["widget"]);
      const srcRelativeDestFilePath = path.join("widgets", options["srcDir"], fInfo.relativeDirPath, destFileName);
      const destFile = this._getDestFile(plugin, srcRelativeDestFilePath);
      if (!this.fs.exists(destFile)) {
        this.fs.copyTpl(fInfo.filePath, destFile, options);
      }
    });
    this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
      path: `${namespace}/widgets/${options["srcDir"]}/${options["srcDir"]}.view`
    }, {
      path: `i18n!${namespace}/widgets/${options["srcDir"]}/impl/nls/${options["srcDir"]}.manifest`
    }, {
      path: `json!${namespace}/widgets/${options["srcDir"]}/${options["srcDir"]}.manifest.json`
    } ]);
  }
};