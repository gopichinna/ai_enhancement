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
    this.prompts["typedNamePrefix"] = _.capitalize(this.prompts["type"]);
    this.prompts["typedModulePrefix"] = this._deduceName(this.prompts["type"]);
    this.prompts["namespace"] = this.prompts["namespace"] || this.pluginMap[this.prompts["plugin"]].namespace;
    this._addAppScopeDefinition(this.prompts);
    if (this.prompts["defaultType"]) {
      this._addDefaultTypeMap(this.prompts);
    }
    this._addPerspective(this.prompts);
  }
  _addPerspective(options = {}) {
    const plugin = options["plugin"], namespace = options["namespace"];
    const topLevelFiles = [ {
      moduleName: "widget.column.collection",
      srcRelativeTargetDir: "models/table"
    }, {
      moduleName: "widget.collection",
      srcRelativeTargetDir: "models"
    }, {
      moduleName: "widget.collection.factory",
      srcRelativeTargetDir: "utils/contexts/factories"
    }, {
      moduleName: "widget.perspective",
      srcRelativeTargetDir: "utils/perspectives",
      requirePlugin: "json!",
      ext: ".json",
      force: true
    } ];
    topLevelFiles.forEach(t => {
      const destModuleName = t.moduleName.replace(/widget/g, options["typedModulePrefix"]);
      const srcRelativeDestModulePath = `${t.srcRelativeTargetDir}/${destModuleName}`;
      const destModulePath = `${t.requirePlugin || ""}${namespace}/${srcRelativeDestModulePath}${t.ext || ""}`;
      const destFile = this._getDestFile(plugin, srcRelativeDestModulePath, t.ext);
      if (!this.fs.exists(destFile) || t.force === true) {
        this.fs.copyTpl(this.templatePath(`${t.moduleName}${t.ext || ".js"}`), destFile, options);
      }
      this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
        path: destModulePath
      } ]);
    });
    const baseTemplatePath = this.templatePath("widget");
    this._walkAllFiles(baseTemplatePath, fInfo => {
      const destFileName = fInfo.fileName.replace(/widget/g, options["srcDir"]);
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
  _addAppScopeDefinition(options = {}) {
    const plugin = options.plugin, namespace = options.namespace, targetModuleRelativeToSrc = "extensions/app.scope.perspectives";
    const scopeExtFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    if (!this.fs.exists(scopeExtFile)) {
      this.fs.copy(this.templatePath(path.basename(scopeExtFile)), scopeExtFile);
    }
    const scopeExtPath = `${namespace}/${targetModuleRelativeToSrc}`;
    this._addToExtensionJson(plugin, namespace, "d2/sdk/utils/perspectives/app.scope.perspectives", scopeExtPath);
    this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
      path: scopeExtPath
    } ]);
    const code = this._readJSCode(scopeExtFile);
    if (code) {
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
              const widgetType = options.type;
              const funcNameConfigValidator = `validateConfig${widgetType}${returnElements.length}`;
              let scopeDefCode = `var scope = {
                                     applicationScope: '${options.applicationScope}',
                                     widgetType:'${widgetType}',
                                     ${options.defaultType ? `defaultWidgetType: '${options.defaultType}',` : ""}
                                     perspectiveJson: '${namespace}/utils/perspectives/${options.typedModulePrefix}.perspective.json',
                                     validateConfig: ${funcNameConfigValidator},
                                     defaultTitle: '${options.defaultTitle}'
                                 }`;
              let parsedScopeDefCode = this._readJSCodeFromString(scopeDefCode);
              returnElements.unshift(parsedScopeDefCode.body[0].declarations[0].init);
              let configValidatorCode = `
                                         function ${funcNameConfigValidator}(/*widgetConfig, options*/) {
                                             var validation = {status: true};
                 
                                             // TODO: Validates widgetConfig. Set validation.status = false if the validation should fail.
                 
                                             return validation;
                                         }
                                     `;
              let parsedValidatorCode = this._readJSCodeFromString(configValidatorCode);
              bodyContent.splice(bodyContent.length - 1, 0, parsedValidatorCode);
              return false;
            }
          }
        }
      });
      this._writeJSCode(scopeExtFile, code);
    }
  }
  _addDefaultTypeMap(options = {}) {
    const plugin = options.plugin, namespace = options.namespace, targetModuleRelativeToSrc = "extensions/default.widget.types.map";
    const extFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    if (!this.fs.exists(extFile)) {
      this.fs.copy(this.templatePath(path.basename(extFile)), extFile);
    }
    const extPath = `${namespace}/${targetModuleRelativeToSrc}`;
    this._addToExtensionJson(plugin, namespace, "d2/sdk/utils/landingpage/default.widget.types.map", extPath);
    this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
      path: extPath
    } ]);
    const code = this._readJSCode(extFile);
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
              let re = returnElements.map(oe => {
                return oe.properties.reduce((a, p) => {
                  a[p.key.name] = p.value.value || p.value.name;
                  return a;
                }, {});
              });
              if (re.some(re => re.defaultType === options.defaultType && re.d2WidgetType === options.type)) {
                return false;
              }
              definitionAdded = true;
              let mapDefCode = `var map = {
                                     defaultType: '${options.defaultType}',
                                     d2WidgetType:'${options.type}'
                                 }`;
              let parsedMapDefCode = this._readJSCodeFromString(mapDefCode);
              returnElements.unshift(parsedMapDefCode.body[0].declarations[0].init);
              return false;
            }
          }
        }
      });
      if (definitionAdded) {
        this._writeJSCode(extFile, code);
      }
    }
  }
};