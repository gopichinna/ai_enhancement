/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/controls/icons.v2/icons.v2", "css!smart/controls/icon/impl/icon.view" ], function($, _, Backbone, Marionette, iconRegistry) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "csui-icon-v2-view",
    tagName: "span",
    constructor: function IconView(options = {}) {
      if (!options.model) {
        options.model = new Backbone.Model(_.pick(options, "iconName", "theme", "on", "size", "states", "grayscale", "filter", "colorTheme", "hoverStateByElement", "activeStateByElement", "focusStateByElement", "disabledStateByElement", "allStateByElement"));
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    modelEvents: {
      change: "render"
    },
    render: function() {
      this._ensureViewIsIntact();
      this.triggerMethod("before:render", this);
      var svgHtml = iconRegistry.getIconByNameWithOptions(this.model.attributes);
      this.attachElContent(svgHtml);
      var sizeClass = iconRegistry.getClassForSize(this.model.attributes);
      this.$el.addClass(sizeClass);
      this.isRendered = true;
      this.bindUIElements();
      this.triggerMethod("render", this);
      return this;
    },
    setIcon: function(iconName) {
      this.model.set("iconName", iconName);
    },
    setIconStateIsOn: function(on) {
      this.model.set("on", on);
    }
  });
});