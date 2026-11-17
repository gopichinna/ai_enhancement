/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/rest.resources", "csui/models/command", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/utils", "d2/controls/globalmessage/globalmessage", "i18n!d2/server.adaptors/models/impl/nls/lang" ], function($, _, RestResources, CommandModel, CommandHelper, RestLinkrels, Constants, utils, GlobalMessage, _lang) {
  "use strict";
  return CommandModel.extend({
    sendRequest: function(view, node, method, url, payload) {
      let deffered = $.Deferred(), me = this;
      me.blockActions(view);
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        method: method,
        contentType: Constants.MediaTypes.DCTM_JSON,
        data: JSON.stringify(payload)
      })).done(function(data) {
        me.unblockActions(view);
        deffered.resolve(data);
      }).fail(function(jqXHR, textStatus, errorThrown) {
        me.unblockActions(view);
        deffered.reject(jqXHR, textStatus, errorThrown);
      });
      return deffered.promise();
    },
    blockActions: function(view) {
      view && _.isFunction(view.blockActions) && view.blockActions();
    },
    unblockActions: function(view) {
      view && _.isFunction(view.unblockActions) && view.unblockActions();
    },
    createAnnotations: function(view, node) {
      var deferred = $.Deferred();
      let repositoryLink = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_DOCUMENT_ANNOTATIONS);
      this.sendRequest(view, node, "POST", repositoryLink).then(function(createdAnnotationData) {
        var annotationID = createdAnnotationData?.annotation_id;
        deferred.resolve(annotationID);
      }).fail(function(_jqXHR, _textStatus, errorThrown) {
        deferred.reject(errorThrown);
      });
      return deferred.promise();
    },
    lockAnnotationOrDocument: function(view, node, id, httpMethod) {
      let deferred = $.Deferred(), objId = node.get("id");
      if (httpMethod === null || httpMethod === undefined) {
        httpMethod = "PUT";
      }
      let lockUrl = RestLinkrels.getLink(node.get("links"), RestLinkrels.CHECKOUT);
      lockUrl = lockUrl.replace(objId, id);
      this.sendRequest(view, node, httpMethod, lockUrl).then(function(lockData) {
        CommandHelper.refreshNode(node).done(() => {
          deferred.resolve(lockData);
        });
      }).fail(function(_jqXHR, _textStatus, errorThrown) {
        deferred.reject(errorThrown);
      });
      return deferred.promise();
    },
    getNativeAnnotationsForCollabEdit: function(view, node) {
      var deferred = $.Deferred();
      let nativeAnnotationsLink = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_NATIVE_ANNOTATIONS_COLLABORATIVE);
      this.sendRequest(view, node, "GET", nativeAnnotationsLink + "?inline=true").then(function(nativeAnnotationData) {
        deferred.resolve(nativeAnnotationData);
      }).fail(function(_jqXHR, _textStatus) {
        deferred.reject(_jqXHR);
      });
      return deferred.promise();
    },
    batchCallWithNativeAnnotations: function(view, node, nativeAnnotationData) {
      let batchPayload = [], me = this;
      me.blockActions(view);
      for (let entry of nativeAnnotationData.entries) {
        let downloadURL = RestLinkrels.getLink(entry.content.links, RestLinkrels.DOWNLOAD_URLS);
        let blockBatchData = {
          id: entry.id,
          request: {
            method: "GET",
            uri: downloadURL
          }
        };
        batchPayload.push(blockBatchData);
      }
      let deferred = $.Deferred();
      utils.makeBatchAjaxCall({
        connector: node.connector,
        operations: batchPayload,
        continueOnError: true
      }).done(function(successful, failed) {
        me.unblockActions(view);
        if (failed && failed.length > 0) {
          var errorMessage;
          _.each(failed, function(operation) {
            if (operation.id === "menuActions" || operation.id === "userMenu") {
              errorMessage = operation.output.message + "\n";
            } else {
              deferred.reject();
              return;
            }
          });
          if (errorMessage) {
            GlobalMessage.showMessage("error", errorMessage);
          }
        }
        deferred.resolve(successful);
      }).fail(function(errData) {
        me.unblockActions(view);
        deferred.reject(errData);
      });
      return deferred.promise();
    },
    getDownloadData: function(view, node, id) {
      let objId = node.get("id"), deferred = $.Deferred();
      let downloadLink = RestLinkrels.getLink(node.get("links"), RestLinkrels.DOWNLOAD_URLS);
      downloadLink = downloadLink.replace(objId, id);
      this.sendRequest(view, node, "GET", downloadLink).then(function(downloadData) {
        deferred.resolve(downloadData);
      }).fail(function(_jqXHR, _textStatus, errorThrown) {
        deferred.reject(errorThrown);
      });
      return deferred.promise();
    },
    execute: function(_status) {
      let deffered = $.Deferred();
      return deffered.promise();
    }
  });
});