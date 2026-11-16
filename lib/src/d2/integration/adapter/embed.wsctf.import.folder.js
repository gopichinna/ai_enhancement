/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/jquery.parse.param", "nuc/lib/backbone", "nuc/models/nodes", "csui/controls/progressblocker/blocker", "dctmw/utils/rest.resources", "d2/integration/adapter/embed.base.adapter", "d2/utils/constants", "d2/utils/creation.utils", "d2/integration/impl/embedder.utils", "d2/ctf/utils", "i18n!d2/integration/adapter/impl/nls/lang", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Marionette, parseParams, Backbone, NodeCollection, BlockingView, RestResources, EmbedBaseAdapter, constants, CreationUtils, embedderUtils, ctfUtils, lang, commandLang) {
  "use strict";
  return EmbedBaseAdapter.extend({
    constructor: function EmbedWsctfImportAdapter() {
      EmbedBaseAdapter.prototype.constructor.apply(this, arguments);
      this.commandParams = embedderUtils.getCommandParams(this.params);
      $(".binf-widgets.d2-embed").addClass("d2-embed-import-folder-structure");
    },
    preProcess: function() {
      var self = this, dfd = $.Deferred(), preProcessData = {}, signature = "D2-ImportFolder", validationMsg = self.validateParams();
      if (validationMsg) {
        return $.Deferred().reject(validationMsg).promise();
      }
      embedderUtils.checkWsctfStatus(self.context, self.commandParams["finishURL"]).done(function() {
        embedderUtils.getFilesFromPath({
          path: self.commandParams.folder,
          isFolder: true
        }).done(function(files) {
          ctfUtils.updateFilePathProperties(files, self.commandParams.folder);
          var filteredFiles = CreationUtils.filterFileArrayMsg(files, false, true);
          if (filteredFiles.length === 0) {
            dfd.reject(commandLang.ImportFolderNoValidFilesInFolder);
            return;
          }
          embedderUtils.getNodeForId(self.params.locateId, self.context, {
            ignoreObjectData: true,
            fetchNewObjectActions: true
          }).done(function(containerNode) {
            if (containerNode && containerNode.actions && !containerNode.actions.findWhere({
              signature: signature
            })) {
              dfd.reject(lang.uploadFilePermissionError);
            }
            var blockingView = self.createBlockingView();
            preProcessData.signature = signature;
            self.status = {
              context: self.context,
              container: containerNode,
              originatingView: blockingView,
              importFixedFile: true,
              returnCommandPromise: true,
              dontCreateFolders: self.commandParams["dontCreateFolders"] === "true"
            };
            self.options = {
              context: self.context,
              files: files
            };
            if (self.params.suppressMessage === "true") {
              self.status.suppressD2SuccessMessage = true;
              self.status.suppressD2FailMessage = true;
              self.status.suppressD2FailMessageSummary = true;
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
    postProcess: function(isSuccess) {
      var eventName = this.getWsctfFinishEventName(), successFiles = this.status && this.status.successFiles && this.status.successFiles.length > 0 ? this.status.successFiles : [], failedFiles = this.status && this.status.failedFiles && this.status.failedFiles.length > 0 ? this.status.failedFiles : [], data, message;
      if (this.status && this.status.disAllowedFiles && this.status.disAllowedFiles.length > 0) {
        failedFiles = failedFiles.concat(_.map(this.status.disAllowedFiles, function(disAllowedFile) {
          if (disAllowedFile.message) {
            disAllowedFile.error = disAllowedFile.message;
          }
          return {
            file: disAllowedFile
          };
        }));
      }
      if (isSuccess === false && !this.status.folderStructureError && this.status.isCancelled === true) {
        message = this.commandParams["finishCancelledMsg"];
      } else {
        if (this.status.folderStructureError) {
          message = this.commandParams["finishFailedMsg"];
          data = {
            error: this.status.folderStructureError ? embedderUtils.getErrorMessage(this.status.folderStructureError) : lang.unableToUploadFileError
          };
        } else {
          if (successFiles.length === 0) {
            message = this.commandParams["finishFailedMsg"];
          } else {
            message = this.commandParams["finishMsg"];
          }
          data = this.getMessageData(successFiles, failedFiles);
        }
      }
      embedderUtils.sendCompletionMsg(this.commandParams["finishURL"], eventName, message, data);
    },
    getMessageData: function(successFiles, failedFiles) {
      var successItems = [], failedItems = [], firstFile = successFiles && successFiles[0] && successFiles[0].file || failedFiles && failedFiles[0] && failedFiles[0].file, folderPath = firstFile && firstFile.rootDirectoryPath, folderName = firstFile && firstFile.rootDirectory, messageData = {
        folder: {
          name: folderName,
          path: folderPath
        }
      }, objectPathIds = {};
      function getFileId(file) {
        if (file && file.relativePath) {
          var subPathArray = file.relativePath.split("/");
          subPathArray.shift();
          if (subPathArray && subPathArray.length > 0) {
            var key = subPathArray.join("/"), objectId = objectPathIds[key];
            return objectId || "";
          }
        }
        return "";
      }
      if (this.status && this.status.folderStructureResponse && this.status.folderStructureResponse.files && this.status.folderStructureResponse.files.length > 0) {
        _.each(this.status.folderStructureResponse.files, function(file) {
          var filePath = file["object_name"];
          var filePathList = filePath && _.reject(filePath.split(/[\\\/]/), function(path) {
            return !path;
          });
          filePath = filePathList && filePathList.join("/");
          objectPathIds[filePath] = file["r_object_id"];
        });
      }
      if (successFiles && successFiles.length > 0) {
        _.each(successFiles, function(item) {
          successItems.push({
            id: getFileId(item.file),
            filename: item.file.name,
            filepath: item.file.path
          });
        });
        messageData["success"] = successItems;
        messageData["importDone"] = true;
      } else {
        messageData["importDone"] = false;
      }
      if (failedFiles && failedFiles.length > 0) {
        _.each(failedFiles, function(item) {
          failedItems.push({
            id: getFileId(item.file),
            filename: item.file.name,
            filepath: item.file.path,
            errorMessage: item.file.error ? embedderUtils.getErrorMessage(item.file.error) : lang.unableToUploadFileError
          });
        });
        messageData["failed"] = failedItems;
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
            commandEvent: "D2_ACTION_CONTENT_IMPORT_STRUCTURE"
          }
        },
        commandParams: {
          paramValues: this.commandParams,
          mandatory: [ "finishAction", "finishURL", "finishMsg", "finishFailedMsg", "finishCancelledMsg", "folder" ],
          paramRules: {
            finishAction: "webSocket"
          }
        }
      });
    },
    createBlockingView: function() {
      var TempBlockingView = Marionette.ItemView.extend({
        className: "d2-temp-blocking-view",
        template: false,
        constructor: function TempBloakingView() {
          Marionette.ItemView.prototype.constructor.apply(this, arguments);
          BlockingView.imbue(this);
        }
      }), blockingView = new TempBlockingView(), $blockingEl = blockingView.render().$el;
      $("body.binf-widgets.d2-embed-import-folder-structure").append($blockingEl);
      return blockingView;
    }
  });
});