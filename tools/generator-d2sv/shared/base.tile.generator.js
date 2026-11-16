/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
'use strict';

const 
  BaseModuleGenerator = require("./base.module.generator"),
  path = require('path'),
  _ = require('../shared/lodash-complete');

module.exports = class BaseTileGenerator extends BaseModuleGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  _addTileDefinition(options = {}) {
    const plugin = options.plugin,
      namespace = options['namespace'] || this.pluginMap[plugin].namespace,
      targetModuleRelativeToSrc = 'extensions/landing.tiles';

    const addableExtFile = this._getDestFile(plugin, targetModuleRelativeToSrc);
    if (!this.fs.exists(addableExtFile)) {
      this.fs.copy(this.templatePath(path.basename(addableExtFile)), addableExtFile);
    }

    const addableExtPath = `${namespace}/${targetModuleRelativeToSrc}`;
    this._addToExtensionJson(plugin, namespace, 'd2/sdk/utils/landingpage/tiles', addableExtPath);
    this._addRequirejsDependenciesToModule(plugin, `bundles/${namespace}-bundle.js`, [{ path: addableExtPath }]);
    this._addRequirejsDependenciesToModule(plugin, targetModuleRelativeToSrc, [{ path: 'd2/sdk/utils/widget.constants', symbol: 'widgetConstants' }]);

    const code = this._readJSCode(addableExtFile);
    if (code) {
      this._traverseCode(code, (node) => {
        if (node && node.type === 'CallExpression') {
          var callee = node.callee;
          if (callee && callee.type === 'Identifier' && callee.name === 'define' && node.arguments.length >= 2 && node.arguments[1].type === 'FunctionExpression') {
            var outerDefineBody = node.arguments[1].body;
            if (outerDefineBody.type === 'BlockStatement') {
              var bodyContent = outerDefineBody.body;
              if (!bodyContent || !Array.isArray(outerDefineBody.body)) {
                bodyContent = outerDefineBody.body = [];
              }

              var returnStatement = bodyContent.find(obj => obj.type === 'ReturnStatement');
              if (!returnStatement) {
                returnStatement = { type: 'ReturnStatement' };
                bodyContent.push(returnStatement);
              }

              var returnArgument = returnStatement.argument;
              if (!returnArgument || returnArgument.type !== 'ArrayExpression') {
                returnArgument = returnStatement.argument = { elements: [], type: 'ArrayExpression' };
              }

              var returnElements = returnArgument.elements;
              if (!returnElements || !Array.isArray(returnElements)) {
                returnElements = returnArgument.elements = [];
              }

              const shortcutType = options.type;
              const funcNameConfigValidator = `validateConfig${shortcutType}${returnElements.length}`;
              const funcNameClickHandler = `clickHandler${shortcutType}${returnElements.length}`;

              let tileDefCode = `var tile = {
                                    type:'${shortcutType}',
                                    icon:'${options.iconClassName}',
                                    ${options.isShortcut === true ? 'isShortcut:true,': ''}
                                    tileConfigType:widgetConstants.TileConfigTypes.${options.hasWidgetConfig ? 'WIDGET' : 'NONE'},
                                    ${(_.isString(options.tileViewPath) && !_.isEmpty(options.tileViewPath)) ? `tileView:'${options.tileViewPath}',` : ''}
                                    ${options.hasWidgetConfig ? `validateConfig:${funcNameConfigValidator},` : ''}
                                    ${options.behavior === 'handler' ? `clickHandler:${funcNameClickHandler}` : ''}
                                    ${options.behavior === 'perspective' ? `applicationScope:'${options.applicationScope}'` : ''}
                                }`;
              let parsedTileDefCode = this._readJSCodeFromString(tileDefCode);
              returnElements.unshift(parsedTileDefCode.body[0].declarations[0].init);

              if (options.hasWidgetConfig) {
                let configValidatorCode = `
                                        function ${funcNameConfigValidator}(/*widgetConfig, options*/) {
                                            var validation = {status: true};
                
                                            // TODO: Validates widgetConfig. Set validation.status = false if the validation should fail.
                
                                            return validation;
                                        }
                                    `;
                let parsedValidatorCode = this._readJSCodeFromString(configValidatorCode);
                bodyContent.splice(bodyContent.length - 1, 0, parsedValidatorCode);
              }

              if (options.behavior === 'handler') {
                let clickHandlerCode = `
                                        function ${funcNameClickHandler}(/*options*/) {
                                            // TODO: Handles click event for this shortcut.
                                            return;
                                        }
                                    `;
                let parsedClickHandlerCode = this._readJSCodeFromString(clickHandlerCode);
                bodyContent.splice(bodyContent.length - 1, 0, parsedClickHandlerCode);
              }

              return false;
            }
          }
        }
      });

      this._writeJSCode(addableExtFile, code);
    }
  }
};
