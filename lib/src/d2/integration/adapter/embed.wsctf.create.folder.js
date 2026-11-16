/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "nuc/lib/backbone", "csui/utils/commands", "d2/integration/adapter/embed.base.adapter", "d2/utils/constants", "d2/utils/server.query.utils", "d2/integration/impl/embedder.utils", "i18n!d2/integration/adapter/impl/nls/lang" ], function(_, $, parseParams, Backbone, commands, EmbedBaseAdapter, constants, serverQueryUtils, embedderUtils, lang) {
  "use strict";
  return EmbedBaseAdapter.extend({
    constructor: function EmbedWsctfCreateFolderAdapter() {
      EmbedBaseAdapter.prototype.constructor.apply(this, arguments);
      this.commandParams = embedderUtils.getCommandParams(this.params);
      $(".binf-widgets.d2-embed").addClass("d2-embed-create-folder");
    },
    preProcess: function() {
      var self = this, dfd = $.Deferred(), preProcessData = {}, validationMsg = self.validateParams(), data = {
        MANAGER: "CreateFolderManager",
        menuId: "menuNewObjNewFolder"
      }, createFolderSignature = "D2-CreateFolder", signature = "D2-EmbedCreateFolder", command = commands.get(signature);
      if (validationMsg) {
        return $.Deferred().reject(validationMsg).promise();
      }
      if (this.commandParams["only_object_type"]) {
        data["only_object_type"] = this.commandParams["only_object_type"];
      } else if (this.commandParams["list_object_type"]) {
        data["list_object_type"] = this.commandParams["list_object_type"];
      } else if (this.commandParams["root_object_type"]) {
        data["root_object_type"] = this.commandParams["root_object_type"];
      }
      data["default_object_type"] = this.commandParams["default_object_type"] ? this.commandParams["default_object_type"] : "";
      self.validateObjectType(command, data).done(function() {
        embedderUtils.checkWsctfStatus(self.context, self.commandParams["finishURL"]).done(function() {
          embedderUtils.getNodeForId(self.params.locateId, self.context, {
            ignoreObjectData: true,
            fetchNewObjectActions: true
          }).done(function(containerNode) {
            var createFolderAction = containerNode && containerNode.actions && containerNode.actions.findWhere({
              signature: createFolderSignature
            });
            if (createFolderAction) {
              var embedCreateFolderAction = createFolderAction.clone();
              embedCreateFolderAction.id = signature;
              embedCreateFolderAction.set("signature", signature);
              containerNode.actions.push(embedCreateFolderAction);
              preProcessData.signature = signature;
              preProcessData.status = {
                context: self.context,
                container: containerNode,
                data: data,
                folderName: self.params.folderName ? self.params.folderName : ""
              };
              preProcessData.options = {};
              if (self.params.suppressMessage === "true") {
                preProcessData.status.suppressD2SuccessMessage = true;
                preProcessData.status.suppressD2FailMessage = true;
              }
              preProcessData.ignoreEnabledCheck = true;
              dfd.resolve(preProcessData);
            } else {
              dfd.reject(lang.createFolderPermissionError);
            }
          }).fail(dfd.reject);
        }).fail(dfd.reject);
      }).fail(dfd.reject);
      return dfd.promise();
    },
    postProcess: function(isSuccess, response) {
      var eventName = this.getWsctfFinishEventName(), message, data;
      if (isSuccess === true && response) {
        data = response.get("id");
        message = this.commandParams["finishMsg"];
      } else if (isSuccess === false && response && !response.isCancelled) {
        data = {
          error: embedderUtils.getErrorMessage(response)
        };
        message = this.commandParams["finishFailedMsg"];
      } else {
        message = this.commandParams["finishCancelledMsg"];
      }
      embedderUtils.sendCompletionMsg(this.commandParams["finishURL"], eventName, message, data);
    },
    getWsctfFinishEventName: function() {
      return this.commandParams["finishEventName"] || "emc.ctf.callbackForCC";
    },
    validateParams: function() {
      return embedderUtils.validateUrlParams({
        hashParams: {
          paramValues: embedderUtils.getHashParams(),
          mandatory: [ "locateId", "commandParam", "id_source", "commandEvent" ],
          paramRules: {
            commandEvent: "D2_ACTION_FOLDER_CREATE"
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
    },
    validateObjectType: function(command, data) {
      var dfd = $.Deferred(), status = {
        data: data,
        nonMenuAction: true
      };
      if (status.data.only_object_type || status.data.list_object_type || status.data.root_object_type) {
        try {
          command._fetchFolderTypes(status);
          dfd.resolve();
        } catch (err) {
          dfd.reject(err.message);
        }
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    }
  });
});