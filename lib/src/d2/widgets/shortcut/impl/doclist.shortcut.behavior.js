/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/behaviors/default.action/default.action.behavior", "csui/utils/commands", "csui/utils/contexts/factories/node", "csui/utils/defaultactionitems", "dctmw/controls/behaviors/defer.dataload.until.visible.behavior", "dctmw/utils/utils", "d2/utils/widgets.utils", "d2/utils/constants", "d2/utils/contexts/factories/node.navigation" ], function(_, DefaultActionBehavior, commands, NodeModelFactory, defaultActionItems, DeferredDataLoadBehavior, Utils, widgetUtils, constants, NodeNavigationCollctionFactory) {
  "use strict";
  var DoclistShortcutBehavior = DefaultActionBehavior.extend({
    constructor: function DoclistShortcutBehavior(options) {
      this.behaviors = _.extend(this.behaviors || {}, {
        DeferredDataLoadBehavior: {
          behaviorClass: DeferredDataLoadBehavior,
          containerSelector: ".module-d2-view",
          dataSource: function() {
            return this.model;
          }.bind(this)
        }
      });
      DoclistShortcutBehavior.__super__.constructor.apply(this, arguments);
      options = options || {};
      this.viewModel = options.viewModel;
      var icon = "icon-folder";
      if (options.data.id === "repository") {
        icon = "icon-repository";
      } else if (options.data.id) {
        if (options.data.id.indexOf("0c") === 0) {
          icon = "icon-cabinet";
        } else {
          icon = "icon-folder";
        }
      }
      this.viewModel.set("icon", icon);
      this.model = options.context.getModel(NodeModelFactory, {
        attributes: {
          id: options.data.id
        },
        options: {
          ignoreObjectData: true
        }
      });
      this.model._expanded = false;
      this.model.excludeResources();
      this.model.resetFields();
      this.model.setFields({
        properties: [ "container", "id", "name", "original_id", "type" ]
      });
      this.model.resetExpand();
      this.model.setExpand({
        properties: [ "original_id" ]
      });
      this.model.resetCommands();
      this.model.setCommands(defaultActionItems.getAllCommandSignatures(commands));
      this.listenToOnce(this.model, "sync error", this.view.render.bind(this.view));
    },
    onRender: function() {
      if (this.model.fetched && this.view.defaultActionController.hasAction(this.model)) {
        this.viewModel.set("enabled", true);
      } else {
        this.viewModel.set("enabled", false);
      }
    },
    onClick: function() {
      var context = this.options.context, nodeNavigationCollection = context && context.getCollection(NodeNavigationCollctionFactory);
      nodeNavigationCollection && nodeNavigationCollection.reset();
      const widgetName = this.view.widgetName, widgetAncestorInfo = widgetUtils.getAncestorInfo(widgetName);
      if (widgetAncestorInfo?.parentContainer) {
        this.model.set({
          id: widgetAncestorInfo.parentContainer.id
        });
        var namedSessionStorage = Utils.getSessionStore("navigatedFromDoclist");
        namedSessionStorage?.set("navigatedFromDoclist", true);
      }
      this.model._expanded = true;
      this.onExecuteDefaultAction(this.model);
    }
  });
  return DoclistShortcutBehavior;
});