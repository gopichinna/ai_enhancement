/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "nuc/models/nodes", "dctmw/utils/rest.resources", "d2/integration/adapter/embed.base.adapter", "d2/utils/constants", "d2/integration/impl/embedder.utils", "i18n!d2/integration/adapter/impl/nls/lang" ], function(_, $, parseParams, NodeCollection, RestResources, EmbedBaseAdapter, constants, embedderUtils, lang) {
  "use strict";
  return EmbedBaseAdapter.extend({
    constructor: function EmbedWsctfCheckinAdapter() {
      EmbedBaseAdapter.prototype.constructor.apply(this, arguments);
      this.commandParams = embedderUtils.getCommandParams(this.params);
      $(".binf-widgets.d2-embed").addClass("d2-embed-checkin");
    },
    preProcess: function() {
      var self = this, dfd = $.Deferred(), preProcessData = {}, validationMsg = self.validateParams();
      if (validationMsg) {
        return $.Deferred().reject(validationMsg).promise();
      }
      embedderUtils.checkWsctfStatus(self.context, self.commandParams["finishURL"]).done(function() {
        embedderUtils.getFilesFromPath({
          path: self.commandParams.files
        }).done(function(files) {
          embedderUtils.getNodeForId(self.params.locateId, self.context, {
            fetchPreviewFormats: false,
            fetchFavorites: false,
            fetchRelationsCount: false,
            fetchExternalShare: false
          }).done(function(node) {
            var validationMsgForNode = self.validateNode(node);
            if (validationMsgForNode) {
              dfd.reject(validationMsgForNode);
              return;
            }
            preProcessData.signature = "AddVersion";
            preProcessData.status = {
              context: self.context,
              nodes: new NodeCollection(node)
            };
            preProcessData.options = {
              context: self.context,
              files: files,
              checkinFixedFile: true,
              refreshSelectedNode: false,
              showProcessingStep: true,
              disableConcurrentProcess: true
            };
            if (self.params.suppressMessage === "true") {
              preProcessData.options.suppressProgress = true;
              preProcessData.options.hideSuccessMessage = true;
              preProcessData.options.hideFailureMessage = true;
            }
            dfd.resolve(preProcessData);
          }).fail(dfd.reject);
        }).fail(dfd.reject);
      }).fail(dfd.reject);
      return dfd.promise();
    },
    postProcess: function(isSuccess, response) {
      var eventName = this.getWsctfFinishEventName(), message, data;
      if (isSuccess === true && response && response.properties) {
        data = {
          new_id: response.properties["r_object_id"]
        };
        if (response.addVersionInfo && response.addVersionInfo.retain_lock) {
          data["retain_lock"] = response.addVersionInfo.retain_lock;
        }
        message = this.commandParams["finishMsg"];
      } else if (isSuccess === false && response) {
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
    validateNode: function(node) {
      if (!node.get("reserved")) {
        return _.str.sformat(lang.documentNotCheckedOutError, node.get("name"));
      }
      if (node.get("reserved_user_id") !== RestResources.getCurrentUser().get("id")) {
        return _.str.sformat(lang.documentCheckedOutByDifferentUserError, node.get("name"));
      }
    },
    validateParams: function() {
      return embedderUtils.validateUrlParams({
        hashParams: {
          paramValues: embedderUtils.getHashParams(),
          mandatory: [ "locateId", "commandParam", "id_source", "commandEvent" ],
          paramRules: {
            commandEvent: "D2_ACTION_CONTENT_CHECKIN"
          }
        },
        commandParams: {
          paramValues: this.commandParams,
          mandatory: [ "files", "finishAction", "finishURL", "finishMsg", "finishFailedMsg", "finishCancelledMsg" ],
          paramRules: {
            finishAction: "webSocket"
          }
        }
      });
    }
  });
});