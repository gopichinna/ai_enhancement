/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/models/nodes", "csui/models/command", "csui/utils/commandhelper", "d2/utils/constants", "dctmw/utils/rest.resources", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, NodeCollection, CommandModel, CommandHelper, constants, RestResources, lang) {
  "use strict";
  const ShowDialog = CommandModel.extend({
    defaults: {
      signature: "D2-ShowDialog",
      command_key: "D2-ShowDialog",
      name: lang.CommandShowDialog,
      scope: "multiple"
    },
    enabled: function(status, options) {
      let menuType;
      if (status.toolItem) {
        let props = status.toolItem.get("actionProperties");
        menuType = props && props.menuType;
      }
      if (menuType === constants.MenuTypes.USER) {
        let userMenuActions = RestResources.getCurrentUser().get("MenuActions");
        if (userMenuActions instanceof Backbone.Collection) {
          return !!userMenuActions.get(this.get("signature"));
        }
      } else if (menuType === constants.MenuTypes.NEW_OBJECT) {
        if (status.container) {
          let nodes = new NodeCollection([ status.container ]), newStatus = _.defaults({
            nodes: nodes
          }, status);
          return ShowDialog.__super__.enabled.call(this, newStatus, options);
        } else {
          console.warn("status.container not defined.");
        }
      }
      return ShowDialog.__super__.enabled.call(this, status, options);
    },
    execute: function(status) {
      let dfd = $.Deferred(), nodes = CommandHelper.getAtLeastOneNode(status), applicableNodes = nodes && nodes.length ? status.data.raw === "true" ? [ ...nodes.models ] : [ nodes.at(0) ] : [];
      status.suppressSuccessMessage = true;
      status.suppressFailureMessage = true;
      require([ "d2/dialogs/generic/dynamic.dialog" ], function(DynamicDialog) {
        const dialog = new DynamicDialog({
          nodes: new NodeCollection(applicableNodes),
          data: _.omit(status?.data, "menuId"),
          viewMode: status?.data?.viewMode || constants.WizardType.DIALOG,
          context: status.context,
          collection: status.collection,
          originatingView: status.originatingView
        });
        dialog.show(status?.data?.DIALOG_NAME).on("wizard:closed", dfd.resolve);
      }, dfd.reject);
      return dfd.promise();
    }
  });
  return ShowDialog;
});