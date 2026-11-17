/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commandhelper", "csui/controls/toolbar/toolbar.view", "d2/server.adaptors/models/node.multiple.actions.mixin" ], function($, _, CommandHelper, ToolbarView, NodeMultipleActionsMixin) {
  "use strict";
  var originalRenderLazyActions = ToolbarView.prototype._renderLazyActions;
  ToolbarView.prototype._renderLazyActions = function(selectedNodes) {
    if (selectedNodes.length) {
      var firstSelectedNode = selectedNodes.models[0], menuType, widgetType;
      if (selectedNodes.nonPromotedActionsOptions && selectedNodes.nonPromotedActionsOptions.menuType && selectedNodes.nonPromotedActionsOptions.widgetType) {
        menuType = selectedNodes.nonPromotedActionsOptions.menuType;
        widgetType = selectedNodes.nonPromotedActionsOptions.widgetType;
      } else if (firstSelectedNode.nonPromotedActionsOptions && firstSelectedNode.nonPromotedActionsOptions.menuType && firstSelectedNode.nonPromotedActionsOptions.widgetType) {
        menuType = firstSelectedNode.nonPromotedActionsOptions.menuType;
        widgetType = firstSelectedNode.nonPromotedActionsOptions.widgetType;
      }
      selectedNodes.setNonPromotedActionsOptions({
        menuType: menuType,
        widgetType: widgetType
      });
      selectedNodes.options ??= {};
      selectedNodes.options.d2ActionsOptions ??= {};
      selectedNodes.options.d2ActionsOptions.menuType = menuType;
      selectedNodes.options.d2ActionsOptions.widgetType = widgetType;
      selectedNodes._requestsNonPromotedRestActions = _.bind(NodeMultipleActionsMixin.mixin({})._requestsNonPromotedRestActions, selectedNodes, selectedNodes._requestsNonPromotedRestActions);
    }
    originalRenderLazyActions.apply(this, arguments);
  };
  ToolbarView.prototype._setUnblocked = function(eventArgs) {
    this._toolbarBlocked = false;
    var command = eventArgs.command, toolItemView = eventArgs.status && eventArgs.status.toolItemView, commandData = eventArgs.status && eventArgs.status.toolItem && eventArgs.status.toolItem.get("commandData"), $el = command && command.get("selfBlockOnly") && toolItemView ? toolItemView.$el.find("a") : this.$el;
    if (!this._blockedTimer) {
      $el.removeClass("binf-disabled");
      if (eventArgs && eventArgs.cancelled) {
        var targetToolItem;
        if (commandData && !!commandData.dynamic || eventArgs.status && eventArgs.status.data && !!eventArgs.status.data.dynamic) {
          var commandName = eventArgs.commandSignature.toLowerCase() + "_" + eventArgs.status.toolItem.cid;
          targetToolItem = this.$el.find("[data-csui-command=" + '"' + commandName + '"' + "] a");
        } else {
          targetToolItem = this.$el.find("[data-csui-command=" + eventArgs.commandSignature.toLowerCase() + "] a");
        }
        var isUnderDropDown = targetToolItem.length ? targetToolItem.closest("ul.csui-more-dropdown-menu") : {};
        if (isUnderDropDown.length) {
          isUnderDropDown.siblings("a.binf-dropdown-toggle").trigger("focus");
        } else {
          targetToolItem.trigger("focus");
        }
      }
    }
  };
});