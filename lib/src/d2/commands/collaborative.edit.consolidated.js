/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/rest.resources", "csui/models/command", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/commands/content-annotations", "dctmw/utils/utils", "d2/controls/globalmessage/globalmessage", "d2/ctf/ctfBridge", "d2/ctf/constants", "d2/commands/reserve", "d2/commands/download" ], function($, _, RestResources, CommandModel, CommandHelper, RestLinkrels, Constants, contentAnnotations, utils, GlobalMessage, ctfBridge, ctfConstants, ReserveCommand, DownloadCommand) {
  "use strict";
  return contentAnnotations.extend({
    defaults: {
      signature: "D2-ReviewEditConsolidatedCopy",
      command_key: "D2-ReviewEditConsolidatedCopy",
      scope: "single"
    },
    reviewAndEditConsolidatedCopy: function(node, status) {
      let me = this;
      let documentObjectId = node.get("id");
      let createdAnnotationId = "";
      let view = status.originatingView;
      me.blockActions(view);
      this.createAnnotations(view, node).then(function(annotationID) {
        createdAnnotationId = annotationID;
        return me.lockAnnotationOrDocument(view, node, annotationID);
      }).then(function() {
        return me.getNativeAnnotationsForCollabEdit(view, node);
      }).then(function(nativeAnnotationsData) {
        return me.batchCallWithNativeAnnotations(view, node, nativeAnnotationsData);
      }).then(function(annotationsContentDownloadData) {
        let deferred = $.Deferred();
        let options = {
          connector: node.connector
        };
        let docIndex = annotationsContentDownloadData.findIndex(obj => obj.id === documentObjectId);
        if (docIndex !== 1) {
          annotationsContentDownloadData.splice(docIndex, 1);
        }
        const reserveHelper = new ReserveCommand();
        const downloadHelper = new DownloadCommand();
        reserveHelper._validateCtfPath(options).then(function() {
          options.opType = ctfConstants.OpType.VIEW;
          options.mode = ctfConstants.Mode.VIEW;
          reserveHelper._validateCtfPath(options).then(function() {
            const targetFolder = downloadHelper._getDownloadPathForWsCtf(ctfConstants.OpType.CHECKOUT);
            const viewTargetFolder = downloadHelper._getDownloadPathForWsCtf(ctfConstants.OpType.VIEW);
            let createdobjUrl = "";
            let annotationIdsArray = [];
            function downloadAnnotations(index) {
              if (index === annotationsContentDownloadData.length) {
                deferred.resolve({
                  createdAnnotationId: createdAnnotationId,
                  createdobjUrl: createdobjUrl,
                  annotationIdsArray: annotationIdsArray,
                  targetFolder: targetFolder,
                  viewTargetFolder: viewTargetFolder
                });
                return;
              }
              const annotationContent = annotationsContentDownloadData[index];
              const objId = annotationContent.id;
              annotationIdsArray.push(objId);
              const annotationContentOutput = annotationContent.output;
              let annotationContentUrl = annotationContentOutput.entries[0].content.url;
              if (objId === createdAnnotationId) {
                createdobjUrl = annotationContentUrl;
              }
              const optype = ctfConstants.OpType.DOWNLOAD;
              const openFile = false;
              ctfBridge.publishDownload(objId, annotationContentUrl, optype, openFile, viewTargetFolder, function() {
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
        nativeDownloadEventData.operationType = ctfConstants.OperationType.NATIVE_DOWNLOAD_EDIT_MERGE_SET_REVISION_MODE;
        const nativeobjId = nativeDownloadEventData.createdAnnotationId;
        me.getDownloadData(view, node, nativeobjId).then(async annotationDownloadData => {
          const annotationIds = nativeDownloadEventData.annotationIdsArray.join("|");
          const operationType = nativeDownloadEventData.operationType;
          const createdobjUrl = annotationDownloadData?.entries[0]?.content?.url;
          await ctfBridge.publishNativeDownload(nativeobjId, annotationIds, createdobjUrl, operationType, nativeDownloadEventData.viewTargetFolder, nativeDownloadEventData.targetFolder);
        });
      }).fail(function(error) {
        me.unblockActions(view);
        GlobalMessage.showMessage("error", error);
      });
    },
    execute: function(status) {
      let node = CommandHelper.getJustOneNode(status);
      let deffered = $.Deferred();
      this.reviewAndEditConsolidatedCopy(node, status);
      return deffered.promise();
    }
  });
});