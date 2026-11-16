/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "smart/controls/globalmessage/globalmessage", "smart/controls/progresspanel/progresspanel", "csui/controls/globalmessage/progresspanel.view.ext", "csui/controls/globalmessage/message.dialog.mixin", "csui/utils/nodesprites", "csui/controls/node-type.icon/node-type.icon.view" ], function(module, _, SmartGlobalMessage, SmartProgressPanel, csuiProgressPanelView, MessageDialogMixin, NodeSprites, NodeTypeIconView) {
  "use strict";
  var panelConfig = window.csui.require.s.contexts._.config.config["csui/controls/globalmessage/progresspanel.view.ext"] || {}, progressbarConfig = window.csui.require.s.contexts._.config.config["csui/controls/globalmessage/progressbar.view.ext"] || {}, config = _.defaults(module.config(), panelConfig.csui, progressbarConfig.csui, {
    enhancePanel: false
  });
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
      model?.node && model.set({
        typeIconClass: NodeSprites.findClassByNode(model?.node),
        iconView: new NodeTypeIconView({
          node: model?.node,
          size: "small"
        })
      }, {
        silent: true
      });
    });
  }, GlobalMessage = _.extend({
    ...SmartGlobalMessage
  }, {
    setProgresspanelMessageRegionView: _.bind(SmartProgressPanel.setProgresspanelMessageRegionView, SmartProgressPanel),
    setFileUploadCollection: _.bind(SmartProgressPanel.setFileUploadCollection, SmartProgressPanel),
    showFileUploadProgress: _.bind(SmartProgressPanel.showFileUploadProgress, SmartProgressPanel),
    hideFileUploadProgress: _.bind(SmartProgressPanel.hideFileUploadProgress, SmartProgressPanel),
    showProgressPanel: function(collection, opts) {
      var optns = _.extend(opts, {
        ProgressPanelview: csuiProgressPanelView,
        configOptions: config
      });
      collectionUpdate(collection);
      _.bind(SmartProgressPanel.showProgressPanel, SmartProgressPanel, collection, optns)();
    },
    isActionInProgress: _.bind(SmartProgressPanel.isActionInProgress, SmartProgressPanel),
    showPermissionApplyingProgress: _.bind(SmartProgressPanel.showPermissionApplyingProgress, SmartProgressPanel),
    showLoader: _.bind(SmartProgressPanel.showLoader, SmartProgressPanel),
    changeLoaderMessage: _.bind(SmartProgressPanel.changeLoaderMessage, SmartProgressPanel),
    showMessage: function(info, text, details, options) {
      var optns = _.extend(options || {}, {
        configOptions: config,
        MessageDialogMixin: MessageDialogMixin
      });
      _.bind(SmartGlobalMessage.showMessage, SmartGlobalMessage, info, text, details, optns)();
    }
  });
  return GlobalMessage;
});