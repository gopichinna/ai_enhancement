/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/lib/marionette", "csui/controls/toolbar/toolitem.view", "csui/controls/toolbar/flyout.toolitem.view", "csui/controls/toolbar/toolitem.custom.view" ], function(Backbone, Marionette, ToolItemView, FlyoutToolItemView, ToolItemCustomView) {
  "use strict";
  var ToolItemsView = Marionette.CollectionView.extend({
    tagName: "ul",
    attributes: function() {
      var attrs = {};
      if (this.options.role) {
        attrs.role = this.options.role;
      } else if (this.options.noMenuRoles) {
        attrs.role = "none";
      } else {
        attrs.role = "menu";
      }
      return attrs;
    },
    getChildView: function(item) {
      var customView = item.get("customView");
      var viewClass = item.get("viewClass");
      if (customView === true && viewClass && viewClass.prototype instanceof Backbone.View) {
        return ToolItemCustomView;
      }
      if (customView) {
        if (customView === true) {
          return item.get("commandData").customView || ToolItemView;
        }
        if (customView.prototype instanceof Backbone.View) {
          return customView;
        }
        if (typeof customView === "string") {}
      }
      return item.get("flyout") ? FlyoutToolItemView : ToolItemView;
    },
    childViewOptions: function(model) {
      return {
        toolbarCommandController: this.options.toolbarCommandController,
        toolbarItemsMask: this.options.toolbarItemsMask,
        originatingView: this.options.originatingView,
        blockingParentView: this.options.blockingParentView,
        noMenuRoles: this.options.noMenuRoles,
        useIconsForDarkBackground: this.options.useIconsForDarkBackground
      };
    },
    collectionEvents: {
      remain: "_updateCustomViews"
    },
    constructor: function ToolItemsView(options) {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
    },
    _updateCustomViews: function() {
      this.children.filter(function(view) {
        return view instanceof ToolItemCustomView;
      }).forEach(function(view) {
        view.triggerMethod("update:enabled");
      });
    }
  });
  return ToolItemsView;
});