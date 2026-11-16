/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "nuc/lib/backbone", "nuc/models/nodes", "dctmw/utils/rest.resources", "d2/integration/adapter/embed.base.adapter", "d2/utils/constants", "d2/integration/impl/embedder.utils", "i18n!d2/integration/adapter/impl/nls/lang", "i18n!d2/integration/impl/nls/lang" ], function(_, $, parseParams, Backbone, NodeCollection, RestResources, EmbedBaseAdapter, constants, embedderUtils, lang, embedderLang) {
  "use strict";
  return EmbedBaseAdapter.extend({
    constructor: function EmbedWsctfImportAdapter() {
      EmbedBaseAdapter.prototype.constructor.apply(this, arguments);
      this.commandParams = embedderUtils.getCommandParams(this.params);
      $(".binf-widgets.d2-embed").addClass("d2-embed-import");
    },
    preProcess: function() {
      var self = this, dfd = $.Deferred(), preProcessData = {}, signature = "D2-ImportFile", validationMsg = self.validateParams();
      if (validationMsg) {
        return $.Deferred().reject(validationMsg).promise();
      }
      if (!self.commandParams.files && !self.commandParams.folder) {
        return $.Deferred().reject(_.str.sformat(embedderLang.urlParamMandatoryError, "files/folder")).promise();
      }
      embedderUtils.checkWsctfStatus(self.context, self.commandParams["finishURL"]).done(function() {
        embedderUtils.getFilesFromPath({
          path: self.commandParams.folder || self.commandParams.files,
          isFolder: !!self.commandParams.folder
        }).done(function(files) {
          embedderUtils.getNodeForId(self.params.locateId, self.context, {
            ignoreObjectData: true,
            fetchNewObjectActions: true
          }).done(function(containerNode) {
            if (containerNode && containerNode.actions && !containerNode.actions.findWhere({
              signature: signature
            })) {
              dfd.reject(lang.uploadFilePermissionError);
            }
            preProcessData.signature = signature;
            self.status = {
              context: self.context,
              container: containerNode
            };
            self.options = {
              context: self.context,
              files: files,
              linkedDocumentExist: true,
              fixedFileImport: true
            };
            if (self.params.suppressMessage === "true") {
              self.status.suppressD2SuccessMessage = true;
              self.status.suppressD2FailMessage = true;
              self.status.suppressD2ProgressBar = true;
            }
            preProcessData.status = self.status;
            preProcessData.options = self.options;
            preProcessData.ignoreEnabledCheck = true;
            dfd.resolve(preProcessData);
          }).fail(dfd.reject);
        }).fail(dfd.reject);
      }).fail(dfd.reject);
      return dfd.promise();
    },
    postProcess: function(isSuccess, response) {
      var eventName = this.getWsctfFinishEventName(), files = this.options && this.options.files || [], successNodes = isSuccess === true && response && _.isArray(response) && response.length > 0 ? response : [], failedNodes = this.status && this.status.failedNodes && this.status.failedNodes.length > 0 ? this.status.failedNodes : [], allItemsFailed = files.length === failedNodes.length, data, message;
      if (isSuccess === false && allItemsFailed === false && this.status.isCancelled === true) {
        message = this.commandParams["finishCancelledMsg"];
      } else {
        if (successNodes.length > 0) {
          message = this.commandParams["finishMsg"];
        } else {
          message = this.commandParams["finishFailedMsg"];
        }
        data = this.getMessageData(successNodes, failedNodes);
      }
      embedderUtils.sendCompletionMsg(this.commandParams["finishURL"], eventName, message, data);
    },
    getMessageData: function(successNodes, failedNodes) {
      var messageData = "";
      if (this.commandParams.files) {
        if (successNodes && successNodes.length === 1) {
          messageData = successNodes[0].get("id");
        } else if (failedNodes && failedNodes.length === 1) {
          messageData = {
            error: failedNodes[0].error ? embedderUtils.getErrorMessage(failedNodes[0].error) : lang.unableToUploadFileError
          };
        }
      } else if (this.commandParams.folder) {
        var successFiles = [], failedFiles = [], folderPath = this.commandParams.folder, folderPathList = _.reject(folderPath.split(/[\\\/]/), function(path) {
          return !path;
        }), folderName = folderPathList && folderPathList.length && folderPathList[folderPathList.length - 1] || "";
        messageData = {
          folder: {
            name: folderName,
            path: folderPath
          }
        };
        if (successNodes && successNodes.length > 0) {
          _.each(successNodes, function(node) {
            successFiles.push({
              id: node.get("id"),
              filename: node.contentFile.name,
              filepath: node.contentFile.path
            });
          });
          messageData["success"] = successFiles;
          messageData["importDone"] = true;
        } else {
          messageData["importDone"] = false;
        }
        if (failedNodes && failedNodes.length > 0) {
          _.each(failedNodes, function(node) {
            failedFiles.push({
              id: node.get("id"),
              filename: node.contentFile.name,
              filepath: node.contentFile.path,
              errorMessage: node.error ? embedderUtils.getErrorMessage(node.error) : lang.unableToUploadFileError
            });
          });
          messageData["failed"] = failedFiles;
        }
      }
      return messageData;
    },
    getWsctfFinishEventName: function() {
      return this.commandParams["finishEventName"] || "emc.ctf.callbackForCC";
    },
    validateParams: function() {
      return embedderUtils.validateUrlParams({
        hashParams: {
          paramValues: embedderUtils.getHashParams(),
          mandatory: [ "commandParam", "id_source", "commandEvent" ],
          paramRules: {
            commandEvent: "D2_ACTION_CONTENT_IMPORT"
          }
        },
        commandParams: {
          paramValues: this.commandParams,
          mandatory: [ "finishAction", "finishURL", "finishMsg", "finishFailedMsg", "finishCancelledMsg" ],
          paramRules: {
            finishAction: "webSocket"
          }
        }
      });
    }
  });
});