/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/lib/marionette", "csui/controls/toolbar/otctoolbar/otctoolitem.view", "csui/controls/toolbar/otctoolbar/otcflyout.toolitem.view", "csui/controls/toolbar/toolitem.custom.view", "hbs!csui/controls/toolbar/otctoolbar/impl/toolbar.template", "smart/themes/theming" ], function(Backbone, Marionette, OTCToolItemView, OTCFlyoutToolItemView, ToolItemCustomView, template, theming) {
  "use strict";
  var OTCToolItemsView = Marionette.CompositeView.extend({
    template: template,
    childViewContainer: "otc-toolbar",
    attributes: function() {
      let attrs = {};
      attrs["data-theme"] = theming.getTheme();
      if (this.options.role) {
        attrs.role = this.options.role;
      } else if (this.options.noMenuRoles) {
        attrs.role = "none";
      } else {
        attrs.role = "menu";
      }
      return attrs;
    },
    templateHelpers: function() {
      return {
        size: theming.isJATOTheme() ? "small" : "regular",
        maxItems: this.options.maxItemsShown || 0,
        isWrapWideItems: this.options.isWrapWideItems !== false
      };
    },
    ui: {
      otctoolbar: "otc-toolbar"
    },
    getChildView: function(item) {
      var customView = item.get("customView");
      var viewClass = item.get("viewClass");
      if (customView === true && viewClass && viewClass.prototype instanceof Backbone.View) {
        return ToolItemCustomView;
      }
      if (customView) {
        if (customView === true) {
          return item.get("commandData").customView || OTCToolItemView;
        }
        if (customView.prototype instanceof Backbone.View) {
          return customView;
        }
        if (typeof customView === "string") {}
      }
      return item.get("flyout") ? OTCFlyoutToolItemView : OTCToolItemView;
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
    constructor: function OTCToolItemsView(options) {
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },
    attachHtml: function(collectionView, childView, index) {
      let container = this.getChildViewContainer(collectionView)[0];
      let placeholder = container.querySelector("otc-toolbarplaceholder");
      if (placeholder) {
        container.insertBefore(childView.el, placeholder);
      } else {
        container.appendChild(childView.el);
      }
    },
    _updateCustomViews: function() {
      this.children.filter(function(view) {
        return view instanceof ToolItemCustomView;
      }).forEach(function(view) {
        view.triggerMethod("update:enabled");
      });
    }
  });
  return OTCToolItemsView;
});