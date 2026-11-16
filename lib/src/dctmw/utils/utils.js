/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/namedlocalstorage", "nuc/utils/namedsessionstorage", "nuc/utils/base", "csui/utils/taskqueue", "dctmw/utils/constants", "dctmw/utils/sw.utils", "nuc/lib/jquery.when.all" ], function(require, $, _, NamedLocalStorage, NamedSessionStorage, base, TaskQueue, constants, serviceWorker) {
  "use strict";
  var D2KEY = "D2", appPathName;
  var taskQueue = new TaskQueue({
    parallelism: 5
  });
  function splitAndMakeSeparateAjaxCallFromBatch(options) {
    if (serviceWorker.isEnabled() && options.operations.length <= 10 && _.all(options.operations, function(o) {
      return (o.request.method || "").toUpperCase() === "GET";
    })) {
      var dfd = $.Deferred(), successful = [], failed = [], createTask = function(op, deferred) {
        return {
          worker: function() {
            if (op.request && op.request.uri) {
              $.ajax(options.connector.extendAjaxOptions({
                url: op.request.uri,
                type: op.request.method,
                skipSWCache: options.skipSWCache,
                success: function(response) {
                  successful.push({
                    id: op.id,
                    state: "FINISHED",
                    output: response
                  });
                  deferred.resolve(response);
                },
                error: function(request, textStatus, error) {
                  failed.push({
                    id: op.id,
                    state: "FAILED",
                    output: textStatus
                  });
                  deferred.reject(request, textStatus, error);
                }
              }));
            } else {
              deferred.resolve();
            }
            return deferred.promise();
          }
        };
      };
      var promises = _.map(options.operations, function(operation) {
        var deferred = $.Deferred();
        taskQueue.pending.add(createTask(operation, deferred));
        return deferred.promise();
      });
      $.whenAll.apply($, promises).always(function() {
        dfd.resolve(successful, failed);
      });
      return dfd.promise();
    }
  }
  return {
    getAppContext: function() {
      if (!appPathName) {
        appPathName = window.location.pathname.split("/")[1];
      }
      return appPathName;
    },
    getStoreKey: function(key) {
      return D2KEY + ":" + this.getAppContext() + ":" + key;
    },
    getLocalStore: function(key) {
      return new NamedLocalStorage(this.getStoreKey(key));
    },
    getSessionStore: function(key) {
      return new NamedSessionStorage(this.getStoreKey(key));
    },
    isMobile: function() {
      return !!window.sv.config.mobile;
    },
    isAppworks: function() {
      return !!window.sv.config.appworks;
    },
    openUrlInWindow: function(url, wnd, focus, keepLink) {
      wnd = wnd || window;
      if (wnd !== window && keepLink !== true) {
        wnd.opener = null;
      }
      wnd.location.href = url;
      !!focus && wnd.focus();
    },
    launchUrlInIframe: function(url) {
      var id = _.uniqueId("open_iframe_"), iframe = $("<iframe></iframe>").hide().attr("id", id).attr("name", id).attr("title", "Open").appendTo($(document.body)), iframeEl = iframe[0];
      iframeEl.src = url;
      setTimeout(function() {
        iframe.remove();
      }, 100);
    },
    isUserAuthenticated: function(connector) {
      return connector.connection.credentials || connector.authenticator.isAuthenticated() || connector.authenticator.syncStorage().isAuthenticated();
    },
    makeBatchAjaxCall: function(options) {
      if (!options || !options.operations) {
        throw new Error("operations attribute is mandatory in the first argument");
      }
      if (!options || !options.connector) {
        throw new Error("connector attribute is mandatory in the first argument");
      }
      var splitStatus = splitAndMakeSeparateAjaxCallFromBatch(options);
      if (splitStatus) {
        return splitStatus;
      }
      var deferred = $.Deferred();
      require([ "dctmw/utils/rest.resources", "dctmw/utils/rest.linkrels" ], function(RestResources, RestLinkrels) {
        var currRepoLinks = RestResources.getCurrentRepository().get("links"), batchUrl = RestLinkrels.getLink(currRepoLinks, RestLinkrels.BATCHES), urlPrefix = window.sv.config.connection.url;
        _.each(options.operations, function(operation) {
          if (operation && operation.request && operation.request.uri && operation.request.uri.indexOf(urlPrefix) === 0) {
            operation.request.uri = operation.request.uri.substring(urlPrefix.length);
          }
        });
        $.ajax(options.connector.extendAjaxOptions({
          url: batchUrl,
          type: "POST",
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          data: JSON.stringify({
            transactional: options.transactional === true,
            sequential: options.sequential === true,
            "on-error": options.continueOnError === true ? "CONTINUE" : "FAIL",
            "return-request": false,
            operations: options.operations
          }),
          success: function(response) {
            var successful = [], failed = [];
            _.each(response.operations, function(operation) {
              var isFailed = operation.state !== "FINISHED", entity = operation.response && operation.response.entity, output, arr = isFailed ? failed : successful;
              if (entity) {
                try {
                  output = JSON.parse(entity);
                } catch (e) {
                  console.warn("Invalid JSON in response. Skipped parsing the same.", entity);
                  output = entity;
                }
              }
              arr.push({
                id: operation.id,
                state: operation.state,
                output: output
              });
            });
            deferred.resolve(successful, failed);
          },
          error: function(request, textStatus, error) {
            deferred.reject(request, textStatus, error);
          }
        }));
      });
      return deferred.promise();
    },
    buildLinkUrl: function(link, isTemplate) {
      if (link) {
        var url = isTemplate === true ? link.hreftemplate : link.href;
        if (url) {
          if (/^(https?:)?\/\//.test(url)) {
            return url;
          } else {
            return window.sv.config.connection.url + url;
          }
        }
      }
      return undefined;
    },
    parseAjaxError: function(xhr, textStatus, errorThrown, includeDetails) {
      var code, details, message, responseType;
      if (xhr && xhr.settings && xhr.settings.dataType) {
        responseType = xhr.settings.dataType;
      }
      if (!responseType && xhr.settings && _.isArray(xhr.settings.dataTypes)) {
        var types = xhr.settings.dataTypes;
        if (_.contains(types, "xml")) {
          responseType = "xml";
        } else if (_.contains(types, "json")) {
          responseType = "json";
        }
      }
      switch (responseType) {
       case "xml":
        var xmlDoc = xhr.responseXML || $(xhr.responseText);
        code = xmlDoc.find("code").text();
        details = xmlDoc.find("details").text();
        message = xmlDoc.find("message").text();
        break;

       case "json":
        var json = xhr.responseJSON || JSON.parse(xhr.responseText);
        code = json.code;
        details = json.details;
        message = json.message;
        break;

       case "object":
        var obj = xhr.responseText;
        code = obj.code;
        details = obj.details;
        message = obj.message;
        break;

       default:
        message = xhr.responseText || errorThrown;
      }
      if (code === "E_INTERNAL_SERVER_ERROR") {
        return {
          code: code,
          message: details || message
        };
      } else {
        return {
          code: code,
          message: message,
          errorDetails: includeDetails === true ? details : undefined
        };
      }
    },
    parseAjaxErrorAsString: function(xhr, textStatus, errorThrown, includeDetails) {
      var errData = this.parseAjaxError(xhr, textStatus, errorThrown, includeDetails);
      return errData.message + (errData.errorDetails ? " - " + errData.errorDetails : "");
    },
    parseError: function(responseType, responseData) {
      return this.parseAjaxError({
        settings: {
          dataType: responseType
        },
        responseText: responseData
      });
    },
    parseErrorAsString: function(responseType, responseData) {
      var errData = this.parseError(responseType, responseData);
      return errData.message + (errData.errorDetails ? " - " + errData.errorDetails : "");
    },
    getAuthHeaders: function(credentials) {
      var headers = {};
      if (credentials.application) {
        headers[constants.Headers.APPLICATION] = credentials.application;
      }
      if (credentials.networkLocation) {
        headers[constants.Headers.NETWORK_LOCATION] = credentials.networkLocation;
      }
      if (this.isMobile()) {
        headers[constants.Headers.CLIENT_APPLICATION] = constants.ApplicationName.MOBILE;
      }
      headers[constants.Headers.CLIENT_TYPE] = this.isMobile() ? constants.ClientTypes.MOBILE : constants.ClientTypes.DESKTOP;
      return headers;
    },
    copyToClipboard: function(clipboardText) {
      var success = false, element = document.createTextNode(clipboardText), elParent = document.createElement("span");
      elParent.style.color = "black";
      elParent.style.background = "tranparent";
      elParent.style.backgroundColor = "white";
      elParent.style.whiteSpace = "pre";
      elParent.appendChild(element);
      document.body.appendChild(elParent);
      if (window.getSelection) {
        var selection = window.getSelection();
        selection.removeAllRanges();
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.addRange(range);
        success = document.execCommand("copy");
        selection.removeAllRanges();
      }
      document.body.removeChild(elParent);
      return success;
    },
    isJqueryPromise: function(value) {
      if (_.isObject(value) && _.isFunction(value.then)) {
        var promiseThenSrc = String($.Deferred().then);
        var valueThenSrc = String(value.then);
        return promiseThenSrc === valueThenSrc;
      }
      return false;
    },
    isNonEmptyString: function(str) {
      return _.isString(str) && !_.isEmpty(str);
    },
    areSameFunctions: function(fn1, fn2) {
      return _.isFunction(fn1) && _.isFunction(fn2) && String(fn1) === String(fn2);
    },
    sanitizeInputText: function(inputText) {
      return inputText && inputText.replace(/(<([^>]+)>)/gi, "");
    },
    isAndroid: function() {
      return /android/i.test(navigator.userAgent);
    },
    isTabletDevice: function() {
      return !this.isMobile() && base.isTouchBrowser() && (this.isAndroid() || base.isAppleMobile());
    },
    compactObject: function(obj) {
      return _.chain(_.pairs(obj)).reject(pair => {
        return pair[1] === undefined || pair[1] === null || pair[1] === "";
      }).object().value();
    }
  };
});