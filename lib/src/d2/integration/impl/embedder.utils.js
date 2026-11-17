/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/log", "csui/utils/contexts/factories/connector", "nuc/models/node/node.model", "dctmw/utils/authenticators/auth.storage", "dctmw/utils/utils", "d2/utils/constants", "dctmw/utils/client.location", "i18n!d2/integration/impl/nls/lang" ], function($, _, log, ConnectorFactory, NodeModel, authStorage, utils, constants, clientLocation, lang) {
  "use strict";
  return {
    checkWsctfStatus: function(context, wsUrl) {
      var dfd = $.Deferred();
      require([ "d2/ctf/constants", "d2/ctf/utils", "d2/ctf/ctfBridge", "d2/ctf/wsHandler" ], _.bind(function(ctfConstants, ctfUtils, ctfBridge, wshandler) {
        if (wsUrl) {
          var wsUrlSplit = wsUrl.split("//");
          if (wsUrlSplit.length === 2 && wsUrlSplit[1]) {
            var urlFragments = wsUrlSplit[1].split("/");
            if (urlFragments.length >= 3 && urlFragments[0]) {
              var hostPortSplit = urlFragments[0].split(":");
              if (hostPortSplit.length === 2) {
                var port = hostPortSplit[1];
                var launchIdSplit = urlFragments[2].split("?");
                if (launchIdSplit.length > 0) {
                  var launchId = launchIdSplit[0];
                  ctfUtils.clearLastConnectionUriParams();
                  ctfUtils.setLastConnectionUriParams(port, launchId);
                }
              }
            }
          }
        }
        ctfBridge.init({
          wshandler: wshandler,
          context: context,
          ignorePreferenceUpdate: true
        });
        var pollInterval = setInterval(function() {
          var wsctfStatus = ctfBridge.getStatus();
          if (wsctfStatus !== ctfConstants.Status.TRYING) {
            if (wsctfStatus === ctfConstants.Status.SUCCESS) {
              wshandler.checkForUpgrade().fail(function() {
                dfd.resolve();
              }).done(function() {
                wshandler.getCTFdownloadUrl().done(function(ctfDownloadUrl) {
                  var link = document.createElement("a");
                  link.href = ctfDownloadUrl;
                  var msg = lang.wsctfNewVersionInfoMessage + "<br/>" + lang.wsctfNewVersionCopyPasteMessage + "<br/>" + '"' + link.href + '"<br/>' + lang.wsctfNewVersionContactMessage;
                  dfd.reject(msg);
                });
              });
            } else {
              dfd.reject(lang.wsctfConnectionError);
            }
            clearInterval(pollInterval);
          }
        }, 100);
      }, this), dfd.reject);
      return dfd.promise();
    },
    parseCustomURLParam: function(customParam) {
      if (customParam) {
        var customParamsMap = {}, customParamList = customParam && customParam.split("!!");
        if (customParamList && customParamList.length > 0) {
          _.each(customParamList, function(item) {
            var customParamSplit = item && item.split("==");
            if (customParamSplit && customParamSplit.length === 2) {
              customParamsMap[customParamSplit[0]] = customParamSplit[1];
            }
          });
        }
        return customParamsMap;
      }
    },
    getCommandParams: function(params) {
      if (params && params["commandParam"]) {
        return this.parseCustomURLParam(params["commandParam"]);
      }
    },
    getQueryParams: function() {
      return clientLocation.getQueryParams();
    },
    getHashParams: function() {
      return clientLocation.getHashParams();
    },
    sendCompletionMsg: function(url, eventName, message, data) {
      var decodeUrl = decodeURIComponent(url);
      var jsonData = {
        event_name: eventName,
        origin: "Documentum Client",
        product_name: "d2sv",
        message: message,
        data: data
      };
      jsonData = JSON.stringify(jsonData);
      var ws = new WebSocket(decodeUrl);
      ws.onopen = function() {
        log.debug("Opened websocket connection url=" + decodeUrl);
        ws.send(jsonData);
        log.debug("Sent message=" + message);
        setTimeout(function() {
          ws.close();
          log.debug("Closed websocket connection");
        }, 10);
      };
    },
    validateUrlParams: function(options) {
      function validateParam(validationData) {
        var i, param;
        if (validationData && validationData.paramValues) {
          if (validationData.mandatory && validationData.mandatory.length > 0) {
            for (i = 0; i < validationData.mandatory.length; i++) {
              if (validationData.mandatory[i]) {
                param = validationData.mandatory[i];
                if (!validationData.paramValues[param]) {
                  return _.str.sformat(lang.urlParamMandatoryError, param);
                }
              }
            }
          }
          if (validationData.paramRules) {
            var paramRulekeys = _.keys(validationData.paramRules);
            for (i = 0; i < paramRulekeys.length; i++) {
              param = paramRulekeys[i];
              if (validationData.paramValues[param] && validationData.paramValues[param] !== validationData.paramRules[param]) {
                return _.str.sformat(lang.incorrectURLParamError, param);
              }
            }
          }
        }
      }
      return validateParam(options.queryParams) || validateParam(options.hashParams) || validateParam(options.commandParams);
    },
    getFilesFromPath: function(options) {
      var dfd = $.Deferred();
      if (options && options.path) {
        require([ "d2/ctf/ctfBridge" ], function(ctfBridge) {
          var ctfFn = options.isFolder ? ctfBridge.publishExtractFilesFromPath : ctfBridge.publishGetFileSizeFromPath;
          ctfFn(options.path, function(files) {
            dfd.resolve(files);
          }, function() {
            dfd.reject(lang.wsctfLoadFileError);
          }, function() {
            dfd.reject(lang.wsctfLoadFileError);
          });
        }, dfd.reject);
      } else {
        dfd.reject(lang.wsctfLoadFileError);
      }
      return dfd.promise();
    },
    getNodeForId: function(id, context, nodeOptions) {
      nodeOptions = nodeOptions || {};
      var dfd = $.Deferred();
      if (id) {
        var node = new NodeModel({
          id: id
        }, _.extend({
          context: context,
          connector: context.getObject(ConnectorFactory)
        }, nodeOptions));
        node._expanded = false;
        node.fetch().done(function() {
          if (nodeOptions.fetchNewObjectActions === true) {
            node._fetchMenuNewObjectItems = true;
            node.fetchMenuNewObjectData(node.get("id")).done(function(newObjectActions) {
              if (newObjectActions) {
                node.actions.add(newObjectActions);
              }
              dfd.resolve(node);
            }).fail(dfd.reject);
          } else {
            dfd.resolve(node);
          }
        }).fail(dfd.reject);
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    getErrorMessage: function(error) {
      var errorMessage;
      if (error) {
        if (_.isArray(error) && error.length > 0) {
          error = error[0];
        }
        if (_.isString(error)) {
          errorMessage = error;
        } else if (error.responseText) {
          errorMessage = utils.parseAjaxErrorAsString(error);
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      return errorMessage;
    }
  };
});