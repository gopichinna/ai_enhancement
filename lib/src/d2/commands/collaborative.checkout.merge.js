/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/rest.resources", "csui/models/command", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/commands/content-annotations", "dctmw/utils/utils", "d2/controls/globalmessage/globalmessage", "d2/ctf/ctfBridge", "d2/ctf/constants", "d2/commands/reserve", "d2/commands/download" ], function($, _, RestResources, CommandModel, CommandHelper, RestLinkrels, Constants, contentAnnotations, utils, GlobalMessage, ctfBridge, ctfConstants, ReserveCommand, DownloadCommand) {
  "use strict";
  return contentAnnotations.extend({
    defaults: {
      signature: "D2-CollaborativeCheckoutMerge",
      command_key: "D2-CollaborativeCheckoutMerge",
      scope: "single"
    },
    checkoutAndMergeCollaborativeChanges: function(node, status) {
      let deferred = $.Deferred();
      let objId = node.get("id"), me = this, view = status.originatingView, objUrl;
      me.blockActions(view);
      if (!node.get("reserved")) {
        me.lockAnnotationOrDocument(view, node, objId);
      }
      me.getNativeAnnotationsForCollabEdit(view, node).then(function(nativeAnnotationData) {
        return me.batchCallWithNativeAnnotations(view, node, nativeAnnotationData);
      }).then(function(downloadData) {
        let deferred = $.Deferred();
        let options = {
          connector: node.connector
        };
        const reserveHelper = new ReserveCommand();
        const downloadHelper = new DownloadCommand();
        reserveHelper._validateCtfPath(options).then(function() {
          options.opType = ctfConstants.OpType.VIEW;
          options.mode = ctfConstants.Mode.VIEW;
          reserveHelper._validateCtfPath(options).then(function() {
            const targetFolder = downloadHelper._getDownloadPathForWsCtf(ctfConstants.OpType.CHECKOUT);
            const viewTargetFolder = downloadHelper._getDownloadPathForWsCtf(ctfConstants.OpType.VIEW);
            let annotationIdsArray = [];
            function downloadAnnotations(index) {
              if (index === downloadData.length) {
                deferred.resolve({
                  annotationIdsArray: annotationIdsArray,
                  targetFolder: targetFolder,
                  viewTargetFolder: viewTargetFolder
                });
                return;
              }
              const annotationContent = downloadData[index];
              const annotationId = annotationContent.id;
              const annotationContentOutput = annotationContent.output;
              let annotationContentUrl = annotationContentOutput.entries[0].content.url;
              if (annotationId === objId) {
                objUrl = annotationContentUrl;
                return downloadAnnotations(index + 1);
              }
              annotationIdsArray.push(annotationId);
              const optype = ctfConstants.OpType.DOWNLOAD;
              const openFile = false;
              ctfBridge.publishDownload(annotationId, annotationContentUrl, optype, openFile, viewTargetFolder, function() {
                downloadAnnotations(index + 1);
              }, errData => {
                deferred.reject(errData);
              });
            }
            downloadAnnotations(0);
          });
        });
        return deferred.promise();
      }).then(async function(nativeDownloadEventData) {
        me.unblockActions(view);
        nativeDownloadEventData.operationType = ctfConstants.OperationType.NATIVE_DOWNLOAD_EDIT_MERGE_ANNOTATION;
        const annotationIds = nativeDownloadEventData.annotationIdsArray.join("|");
        const operationType = nativeDownloadEventData.operationType;
        await ctfBridge.publishNativeDownload(objId, annotationIds, objUrl, operationType, nativeDownloadEventData.viewTargetFolder, nativeDownloadEventData.targetFolder);
      }).fail(function(error) {
        CommandHelper.refreshNode(node).done(() => {
          deferred.resolve();
          me.lockAnnotationOrDocument(view, node, objId, "DELETE");
        });
        me.unblockActions(view);
        GlobalMessage.showMessage("error", error.responseJSON.message, error.responseJSON.details);
      });
    },
    execute: function(status) {
      let node = CommandHelper.getJustOneNode(status);
      let deffered = $.Deferred();
      this.checkoutAndMergeCollaborativeChanges(node, status);
      return deffered.promise();
    }
  });
});