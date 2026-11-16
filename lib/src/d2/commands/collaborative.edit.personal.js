/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/rest.resources", "csui/models/command", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/commands/content-annotations", "dctmw/utils/utils", "d2/controls/globalmessage/globalmessage", "d2/ctf/ctfBridge", "d2/ctf/constants", "d2/commands/reserve", "d2/commands/download" ], function($, _, RestResources, CommandModel, CommandHelper, RestLinkrels, Constants, contentAnnotations, utils, GlobalMessage, ctfBridge, ctfConstants, ReserveCommand, DownloadCommand) {
  "use strict";
  return contentAnnotations.extend({
    defaults: {
      signature: "D2-ReviewEditPersonalCopy",
      command_key: "D2-ReviewEditPersonalCopy",
      scope: "single"
    },
    reviewAndEditPersonalCopy: function(node, status) {
      let me = this;
      let createdAnnotationId = "";
      let view = status.originatingView;
      me.blockActions(view);
      me.createAnnotations(view, node).then(function(annotationID) {
        createdAnnotationId = annotationID;
        me.lockAnnotationOrDocument(view, node, annotationID).done(() => {
          return me.getDownloadData(view, node, annotationID).then(function(annotationDownloadData) {
            me.unblockActions(view);
            const reserveHelper = new ReserveCommand();
            const downloadHelper = new DownloadCommand();
            const annotationDownloadUrl = annotationDownloadData?.entries[0]?.content?.url;
            let options = {
              connector: node.connector
            };
            reserveHelper._validateCtfPath(options).then(function() {
              const targetFolder = downloadHelper._getDownloadPathForWsCtf(ctfConstants.OpType.CHECKOUT);
              ctfBridge.publishNativeDownload(createdAnnotationId, null, annotationDownloadUrl, ctfConstants.OperationType.NATIVE_DOWNLOAD_EDIT_SET_REVISION_MODE, null, targetFolder);
            });
          });
        });
      }).fail(function(error) {
        me.unblockActions(view);
        GlobalMessage.showMessage("error", error);
      });
    },
    execute: function(status) {
      let node = CommandHelper.getJustOneNode(status);
      let deffered = $.Deferred();
      this.reviewAndEditPersonalCopy(node, status);
      return deffered.promise();
    }
  });
});