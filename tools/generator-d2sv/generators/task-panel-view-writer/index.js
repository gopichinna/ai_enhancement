/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
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
    this._addTaskDetailsPanelViewDefinition(this.prompts);
  }
  _addTaskDetailsPanelViewDefinition(options = {}) {
    this._addTaskDetailsPanelViewFile(options);
    this._addTaskDetailsPanelViewTemplate(options);
    this._addTaskDetailsPanelViewStyleSheet(options);
    this._addTaskDetailsPanelViewTranslationFiles(options);
    this._addTaskDetailsPanelExtension(options);
  }
  _addTaskDetailsPanelViewFile(options) {
    const plugin = options.plugin, namespace = options.namespace, viewName = options.viewName, viewPanelName = "task." + viewName.toLowerCase() + ".view", targetModuleRelativeToSrc = `widgets/task.details/panels/${viewName.toLowerCase()}/${viewPanelName}.js`;
    const panelViewFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    options.viewPanelName = viewPanelName;
    if (!this.fs.exists(panelViewFile)) {
      this.fs.copyTpl(this.templatePath("task.details.panel.view.js"), panelViewFile, options);
    }
  }
  _addTaskDetailsPanelViewTemplate(options) {
    const plugin = options.plugin, namespace = options.namespace, viewName = options.viewName, viewTemplateName = "task." + viewName.toLowerCase() + ".view", targetModuleRelativeToSrc = `widgets/task.details/panels/${viewName.toLowerCase()}/impl/${viewTemplateName}.hbs`;
    const templateFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    if (!this.fs.exists(templateFile)) {
      this.fs.copyTpl(this.templatePath("impl/task.details.panel.view.hbs"), templateFile, options);
    }
  }
  _addTaskDetailsPanelViewStyleSheet(options) {
    const plugin = options.plugin, namespace = options.namespace, viewName = options.viewName, viewStyleSheetName = "task." + viewName.toLowerCase() + ".view", targetModuleRelativeToSrc = `widgets/task.details/panels/${viewName.toLowerCase()}/impl/${viewStyleSheetName}.css`;
    const styleSheetFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    if (!this.fs.exists(styleSheetFile)) {
      this.fs.copyTpl(this.templatePath("impl/task.details.panel.view.css"), styleSheetFile, options);
    }
  }
  _addTaskDetailsPanelViewTranslationFiles(options) {
    const plugin = options.plugin, namespace = options.namespace, viewName = options.viewName, targetModuleRelativeToSrc1 = `widgets/task.details/panels/${viewName.toLowerCase()}/impl/nls/lang.js`, targetModuleRelativeToSrc2 = `widgets/task.details/panels/${viewName.toLowerCase()}/impl/nls/root/lang.js`;
    const langFile1 = this._getDestFile(plugin, targetModuleRelativeToSrc1), langFile2 = this._getDestFile(plugin, targetModuleRelativeToSrc2);
    if (!this.fs.exists(langFile1)) {
      this.fs.copy(this.templatePath("impl/nls/lang.js"), langFile1);
    }
    if (!this.fs.exists(langFile2)) {
      this.fs.copyTpl(this.templatePath("impl/nls/root/lang.js"), langFile2, options);
    }
  }
  _addTaskDetailsPanelExtension(options) {
    const plugin = options.plugin, namespace = options.namespace, viewName = options.viewName, viewPanelName = "task." + viewName.toLowerCase() + ".view", viewPanelSymbol = "Task" + _.capitalize(`${viewName}`) + "View", viewModulePath = `${namespace}/widgets/task.details/panels/${viewName.toLowerCase()}/${viewPanelName}`, langFilePath = `i18n!${namespace}/widgets/task.details/panels/${viewName.toLowerCase()}/impl/nls/lang`, targetModuleRelativeToSrc = "extensions/task.details.panel.views";
    const extensionFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    if (!this.fs.exists(extensionFile)) {
      this.fs.copy(this.templatePath("task.details.panel.views.js"), extensionFile);
    }
    const extensionFilePath = `${namespace}/${targetModuleRelativeToSrc}`;
    this._addToExtensionJson(plugin, namespace, "d2/sdk/widgets/task.details.panel/task.details.panel.views", extensionFilePath);
    this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
      path: extensionFilePath
    } ]);
    const code = this._readJSCode(extensionFile);
    if (code) {
      let definitionAdded = false;
      this._traverseCode(code, node => {
        if (node && node.type === "CallExpression") {
          var callee = node.callee;
          if (callee && callee.type === "Identifier" && callee.name === "define" && node.arguments.length >= 2 && node.arguments[1].type === "FunctionExpression") {
            var outerDefineBody = node.arguments[1].body;
            if (outerDefineBody.type === "BlockStatement") {
              var bodyContent = outerDefineBody.body;
              if (!bodyContent || !Array.isArray(outerDefineBody.body)) {
                bodyContent = outerDefineBody.body = [];
              }
              var returnStatement = bodyContent.find(obj => obj.type === "ReturnStatement");
              if (!returnStatement) {
                returnStatement = {
                  type: "ReturnStatement"
                };
                bodyContent.push(returnStatement);
              }
              var returnArgument = returnStatement.argument;
              if (!returnArgument || returnArgument.type !== "ArrayExpression") {
                returnArgument = returnStatement.argument = {
                  elements: [],
                  type: "ArrayExpression"
                };
              }
              var returnElements = returnArgument.elements;
              if (!returnElements || !Array.isArray(returnElements)) {
                returnElements = returnArgument.elements = [];
              }
              definitionAdded = true;
              let panelDefCode = `var behavior = {
								name: '${viewName.toLowerCase()}',
								title: ${viewPanelSymbol}Lang.tabName,
								contentView: ${viewPanelSymbol}
                            }`;
              let parsedBehaviorDefCode = this._readJSCodeFromString(panelDefCode);
              returnElements.unshift(parsedBehaviorDefCode.body[0].declarations[0].init);
              return false;
            }
          }
        }
      });
      if (definitionAdded) {
        this._writeJSCode(extensionFile, code);
        this._addRequirejsDependenciesToModule(plugin, targetModuleRelativeToSrc, [ {
          path: viewModulePath,
          symbol: viewPanelSymbol
        } ]);
        this._addRequirejsDependenciesToModule(plugin, targetModuleRelativeToSrc, [ {
          path: langFilePath,
          symbol: viewPanelSymbol + "Lang"
        } ]);
      }
    }
  }
};