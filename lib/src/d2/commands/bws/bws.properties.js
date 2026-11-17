/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/models/command", "i18n!d2/commands/nls/localized.strings", "csui/utils/commandhelper", "nuc/lib/jquery" ], function(require, CommandModel, lang, CommandHelper, $) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "BWS-Properties",
      command_key: "BWS-Properties",
      name: lang.commandNameBWSProperties,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    _fetchPropertyPage: function(status) {
      let originatingView = status.originatingView;
      originatingView._fetchPropertyPage().done(formContent => {
        this._initializeMetadataWizard(status, formContent);
      });
    },
    _setSelectedTabPanel: function(node) {
      node.set("initialPanel", "bws_properties", {
        silent: true
      });
    },
    _initializeMetadataWizard: function(status, formContent) {
      status.suppressSuccessMessage = true;
      var deferred = $.Deferred();
      var node = CommandHelper.getJustOneNode(status);
      if (node) {
        this._setSelectedTabPanel(node);
        require([ "d2/dialogs/bws/bws.metadata.panel" ], function(BWSTabDialogView) {
          var dialog = new BWSTabDialogView({
            node: node,
            context: status.context,
            formContent: formContent,
            dialogSize: "LARGE"
          });
          dialog.show();
        });
      } else {
        deferred.reject();
      }
      return deferred.promise();
    },
    execute: function(status) {
      this._fetchPropertyPage(status);
    }
  });
});