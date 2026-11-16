/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/globalmessage/globalmessage", "smart/controls/progresspanel/progresspanel", "d2/controls/globalmessage/progresspanel.view.ext", "csui/utils/nodesprites" ], function(module, $, _, Backbone, Marionette, SmartGlobalMessage, SmartProgressPanel, D2ProgressPanelView, NodeSprites) {
  "use strict";
  var collectionUpdate = function(col) {
    col.forEach(function(model) {
      if (!!model.node && model.node.get("mime_type") === undefined) {
        model.node.set({
          container: false,
          type: model.node.get("type") !== undefined ? model.node.get("type") : model.get("type") !== undefined ? model.get("type") : 144,
          mime_type: model.get("mime_type") || model.get("type")
        }, {
          silent: true
        });
      }
      model.set("typeIconClass", NodeSprites.findClassByNode(model.node), {
        silent: true
      });
    });
  }, GlobalMessage = _.extend(SmartGlobalMessage, {
    setProgresspanelMessageRegionView: _.bind(SmartProgressPanel.setProgresspanelMessageRegionView, SmartProgressPanel),
    setFileUploadCollection: _.bind(SmartProgressPanel.setFileUploadCollection, SmartProgressPanel),
    showFileUploadProgress: _.bind(SmartProgressPanel.showFileUploadProgress, SmartProgressPanel),
    hideFileUploadProgress: _.bind(SmartProgressPanel.hideFileUploadProgress, SmartProgressPanel),
    _showMessageView: _.bind(SmartGlobalMessage._showMessageDialogView, SmartGlobalMessage),
    showProgressPanel: function(collection, opts) {
      var enableCancel = opts.enableCancel !== undefined ? opts.enableCancel : true;
      var optns = _.extend(opts, {
        ProgressPanelview: D2ProgressPanelView,
        collection: collection,
        enableCancel: enableCancel,
        enableMinimiseButton: true,
        allowMultipleInstances: true
      });
      if (opts.skipUnique !== true) {
        optns.actionType = _.uniqueId(optns.actionType + "_");
      }
      $(".perspective-module-view").scrollTop(0);
      collectionUpdate(collection);
      SmartProgressPanel.showProgressPanel.call(SmartProgressPanel, optns.collection, optns);
      return optns.actionType;
    },
    isActionInProgress: _.bind(SmartProgressPanel.isActionInProgress, SmartProgressPanel),
    showPermissionApplyingProgress: _.bind(SmartProgressPanel.showPermissionApplyingProgress, SmartProgressPanel),
    showLoader: _.bind(SmartProgressPanel.showLoader, SmartProgressPanel),
    changeLoaderMessage: _.bind(SmartProgressPanel.changeLoaderMessage, SmartProgressPanel),
    cleanupPreviousMessagesForD2: _.bind(SmartGlobalMessage._cleanupPreviousMessageRegion, SmartGlobalMessage),
    hideProgressPanel: function() {
      console.warn("The use of the hideProgressPanel method is deprecated and should be avoided in future implementations.");
    }
  });
  return GlobalMessage;
});