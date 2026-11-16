/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/base", "nuc/utils/log", "nuc/models/node/node.model", "d2/controls/globalmessage/globalmessage", "csui/models/command", "csui/utils/commandhelper", "nuc/utils/url", "csui/utils/contexts/factories/connector", "d2/utils/constants", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/sdk/models/module.collection", "dctmw/events/oah/dctm.oah.handler", "d2/utils/contexts/context.controller", "i18n!d2/commands/nls/localized.strings" ], function(require, module, $, _, base, log, NodeModel, GlobalMessage, CommandModel, CommandHelper, Url, ConnectorFactory, constants, RestResources, utils, ServerModuleCollection, DctmOahHandler, D2ContextController, lang) {
  "use strict";
  log = log(module.id);
  return CommandModel.extend({
    defaults: {
      scope: "multiple",
      signature: "D2-CallService",
      command_key: "D2-CallService"
    },
    CONSTANTS: Object.freeze({
      PATH_SEPARATOR: "/",
      METHOD_SEPARATOR: ":",
      PARAM_SEP_EVENT_PARAMS: "::"
    }),
    _getNodesByScope: function(status, defaultScope) {
      var data = this._getCommandData(status), scope = (data["eMode"] || defaultScope || this.get("scope")).toLowerCase();
      return CommandModel.prototype._getNodesByScope.call(this, status, scope);
    },
    _getCommandData: function(status) {
      return status.data || status.toolItem && status.toolItem.get("commandData") || {};
    },
    execute: function(status, options) {
      var deferred = $.Deferred();
      var data = this._getCommandData(status);
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      var nodes = this._getNodesByScope(status);
      var me = this;
      if (!this.isValidCommandData(data)) {
        deferred.reject();
      } else {
        this.invokeGenericActionService(status, options, data).done(function() {
          deferred.resolve();
          if (!data["rAction"]) {
            me._showGlobalMessage(data["eService"], nodes);
          }
        }).fail(function(err) {
          var msg = err.responseJSON ? err.responseJSON : err;
          GlobalMessage.showMessage("error", msg.message || msg);
          deferred.reject(err);
        });
      }
      return deferred.promise();
    },
    isValidCommandData: function(data) {
      var service_name = data["eService"];
      var method_name = data["eMethod"];
      var rAction = data["rAction"];
      var rType = data["rType"];
      if (service_name == null) {
        GlobalMessage.showMessage("error", lang.ServiceNameRequired);
        return false;
      }
      if (method_name == null) {
        GlobalMessage.showMessage("error", lang.MethodNameRequired);
        return false;
      }
      if (rType === "JS") {
        if (rAction) {
          var tokens = rAction.split(this.CONSTANTS.PATH_SEPARATOR);
          if (tokens.length < 2) {
            GlobalMessage.showMessage("error", lang.ActionNameCheck);
            return false;
          }
          var pluginModuleModels = new ServerModuleCollection().getPluginModules();
          var found = false;
          for (var key = 0; key < pluginModuleModels.length; key++) {
            if (pluginModuleModels[key].get("id") === tokens[0]) {
              found = true;
              break;
            }
          }
          if (!found) {
            GlobalMessage.showMessage("error", lang.ActionNameCheck);
            return false;
          }
          var fnObj = this.parseFunction(rAction);
          if (!fnObj["modPath"]) {
            GlobalMessage.showMessage("error", lang.ActionNameCheck);
            return false;
          }
        }
      }
      return true;
    },
    beforeServiceCall: function() {},
    afterServiceCall: function() {},
    buildData: function(nodes, commandData) {
      var toOmit = [ "eMethod", "eMode", "eService", "menuId", "rAction", "rType" ];
      var properties = _.omit(commandData, toOmit);
      try {
        _.extend(properties, this.beforeServiceCall(nodes, commandData));
      } catch (e) {
        log.warn(e) && console.warn(e);
      }
      return {
        properties: properties
      };
    },
    invokeGenericActionService: function(status, options, data) {
      options = options || {};
      var me = this, nodes = this._getNodesByScope(status);
      options.connector = status.context.getObject(ConnectorFactory);
      _.extend(options, status);
      var deferred = $.Deferred();
      var url = options.connector.connection.url + "/repositories/" + RestResources.getCurrentRepository().get("name") + "/d2-generic-action-service";
      var parameters = {
        service_name: data["eService"],
        method_name: data["eMethod"],
        object_ids: _.map(nodes, function(node) {
          return node.get("id");
        })
      };
      url = Url.appendQuery(url, Url.combineQueryString(parameters));
      $.ajax(options.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        data: JSON.stringify(this.buildData(nodes, data)),
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          try {
            me.afterServiceCall(nodes, data, response.properties);
          } catch (e) {
            log.warn(e) && console.warn(e);
          }
          me.invoke(data["rType"], data["rAction"], nodes, response).done(function() {
            deferred.resolve();
          }).fail(function(err) {
            deferred.reject(err);
          });
        },
        error: deferred.reject
      }));
      return deferred.promise();
    },
    invoke: function(rType, rAction, nodes, response) {
      if (rType === "JS") {
        return this.invokeJS(rAction, nodes, response);
      } else if (rType === "EVENT") {
        return this.invokeEvent(rAction);
      } else if (rType === "NATIVE") {
        return this.invokeNative(rAction, response);
      }
      return $.Deferred().resolve().promise();
    },
    invokeNative: function(rAction, response) {
      if (rAction === "openUrlInPopup") {
        var url = response.properties.url ? response.properties.url : response.properties?.RETURNED;
        window.open(url);
      }
      return $.Deferred().resolve().promise();
    },
    invokeEvent: function(rAction) {
      if (rAction) {
        var eventInfo = rAction.split(this.CONSTANTS.PARAM_SEP_EVENT_PARAMS);
        DctmOahHandler.publish(eventInfo[0], eventInfo[1]);
      }
      return $.Deferred().resolve().promise();
    },
    invokeJS: function(rAction, nodes, response) {
      if (rAction) {
        var fnObj = this.parseFunction(rAction);
        var params = [];
        if (this.isFnWithParams(fnObj)) {
          params = this.getMatchingParams(fnObj["fName"], response);
        }
        return this.invokeScript(fnObj, nodes, response, params);
      }
      return $.Deferred().resolve().promise();
    },
    getParamNames: function(fnName) {
      var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
      var ARGUMENT_NAMES = /([^\s,]+)/g;
      var fnStr = fnName.toString().replace(STRIP_COMMENTS, "");
      var result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
      if (result === null) {
        result = [];
      }
      return result;
    },
    getMatchingParams: function(fnName, response) {
      var matched = [];
      var responseKeys, params;
      if (response && response.properties) {
        responseKeys = Object.keys(response.properties);
        params = this.getParamNames(fnName);
        if (responseKeys.length >= params.length) {
          for (var i = 0; i < params.length; i++) {
            for (var j = 0; j < responseKeys.length; j++) {
              if (params[i] === responseKeys[j]) {
                matched.push(response.properties[responseKeys[j]]);
              }
            }
          }
        }
        if (responseKeys && responseKeys.length && matched.length === params.length) {
          return matched;
        } else {
          return [];
        }
      }
      return matched;
    },
    isFnWithParams: function(fnObj) {
      var fnName = fnObj["fName"];
      if (fnName && fnName.indexOf("(") > -1 && fnName.indexOf(")") > -1 && this.getParamNames(fnName).length > 0) {
        return true;
      }
      return false;
    },
    parseFunction: function(rAction) {
      var fName, modPath;
      var fnSplit = rAction.split(this.CONSTANTS.METHOD_SEPARATOR);
      if (fnSplit.length > 1) {
        fName = fnSplit[1];
      }
      modPath = fnSplit[0];
      return {
        fName: fName,
        modPath: modPath
      };
    },
    invokeScript: function(fnObj, nodes, response, params) {
      var fName, modPath, deferred = $.Deferred(), me = this;
      fName = fnObj["fName"];
      var index = fName && fName.indexOf("(");
      if (index > -1) {
        fName = fName.substring(0, index);
      }
      modPath = fnObj["modPath"];
      params = params || [];
      var invocationArgument, origParamLength = params.length;
      if (!origParamLength) {
        invocationArgument = {
          nodes: nodes,
          data: response["properties"]
        };
      } else {
        params.push(nodes);
        invocationArgument = params;
      }
      require([ modPath ], function(Module) {
        var retVal, err;
        function resolve(retVal, deferred, err) {
          if (utils.isJqueryPromise(retVal)) {
            retVal.done(deferred.resolve).fail(deferred.reject);
          } else if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve();
          }
        }
        if (fName) {
          if (Module[fName]) {
            try {
              if (origParamLength) {
                retVal = Module[fName].apply(null, invocationArgument);
              } else {
                retVal = Module[fName].call(null, invocationArgument);
              }
            } catch (e) {
              err = e;
            }
          } else if (_.isFunction(Module)) {
            try {
              var m = new Module({});
              if (m[fName]) {
                if (origParamLength) {
                  retVal = m[fName].apply(null, invocationArgument);
                } else {
                  retVal = m[fName].call(null, invocationArgument);
                }
              }
            } catch (e) {
              err = e;
            }
          } else {
            err = lang.MethodNotFound;
          }
        } else {
          if (_.isFunction(Module)) {
            var strModule = Module.toString();
            var strFn = strModule.substring("function".length, strModule.indexOf("{")).trim();
            if (me.isFnWithParams({
              fName: strFn
            })) {
              params = me.getMatchingParams(strFn, response);
              origParamLength = params.length;
            }
            try {
              if (origParamLength) {
                params.push(nodes);
                invocationArgument = params;
                retVal = Module.apply(null, invocationArgument);
              } else {
                retVal = Module.call(null, invocationArgument);
              }
            } catch (e) {
              err = e;
            }
          } else {
            err = lang.ModuleIsObject;
          }
        }
        resolve(retVal, deferred, err);
      }, deferred.reject);
      return deferred.promise();
    },
    _showGlobalMessage: function(svc, data) {
      var successMessage = data.length === 1 ? _.str.sformat(lang.CallSvcOneItemSuccessMessage, svc, data[0].get("name")) : _.str.sformat(lang.CallSvcManyItemsSuccessMessage, svc, data.length);
      GlobalMessage.showMessage("success", successMessage, undefined, {});
    },
    subscribeEvents: function() {
      DctmOahHandler.subscribeEvent({
        event: "D2_ACTION_EXECUTE",
        callbackFunction: function(event, message) {
          var dataOptions = {};
          _.each(message.attributes, function(value, key) {
            dataOptions[key] = value;
          }.bind(this));
          var status = {
            context: D2ContextController.getContext(),
            data: dataOptions,
            nodes: [ new NodeModel() ]
          };
          this.execute(status, {});
        }.bind(this)
      });
    }
  });
});