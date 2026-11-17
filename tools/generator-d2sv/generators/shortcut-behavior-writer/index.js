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
    this._addShortcutBehaviorDefinition(this.prompts);
  }
  _addShortcutBehaviorDefinition(options = {}) {
    const plugin = options.plugin, namespace = options.namespace, targetModuleRelativeToSrc = "extensions/shortcut.behaviors";
    const behaviorsExtFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    if (!this.fs.exists(behaviorsExtFile)) {
      this.fs.copy(this.templatePath(path.basename(behaviorsExtFile)), behaviorsExtFile);
    }
    const behaviorsExtPath = `${namespace}/${targetModuleRelativeToSrc}`;
    this._addToExtensionJson(plugin, namespace, "d2/sdk/widgets/shortcut.tile/shortcut.tile.behaviors", behaviorsExtPath);
    this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [ {
      path: behaviorsExtPath
    } ]);
    const behaviorName = _.capitalize(`${options.type}ShortcutBehavior`);
    const behaviorModuleName = this._deduceName(behaviorName);
    const behaviorModuleFile = this._getDestFile(plugin, `widgets/shortcut.tile/${behaviorModuleName}`);
    if (!this.fs.exists(behaviorModuleFile)) {
      this.fs.copyTpl(this.templatePath("shortcut.behavior.js"), behaviorModuleFile, {
        behaviorClassName: behaviorName
      });
    }
    const behaviorModulePath = `${namespace}/widgets/shortcut.tile/${behaviorModuleName}`;
    this._addRequirejsDependenciesToModule(plugin, targetModuleRelativeToSrc, [ {
      path: behaviorModulePath,
      symbol: behaviorName
    } ]);
    const code = this._readJSCode(behaviorsExtFile);
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
              if (re.some(re => re.type === options.type && re.behaviorClass === behaviorName)) {
                return false;
              }
              definitionAdded = true;
              let behaviorDefCode = `var behavior = {
                                    type:'${options.type}',
                                    behaviorClass:${behaviorName}
                                }`;
              let parsedBehaviorDefCode = this._readJSCodeFromString(behaviorDefCode);
              returnElements.unshift(parsedBehaviorDefCode.body[0].declarations[0].init);
              return false;
            }
          }
        }
      });
      if (definitionAdded) {
        this._writeJSCode(behaviorsExtFile, code);
      }
    }
  }
};