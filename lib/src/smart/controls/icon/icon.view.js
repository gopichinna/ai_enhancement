/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "smart/themes/theming", "smart/controls/icons.v2/icons.v2", "css!smart/controls/icon/impl/icon.view" ], function($, _, Backbone, Marionette, theming, iconRegistry) {
  "use strict";
  return Marionette.ItemView.extend({
    className: "csui-icon-v2-view",
    tagName: "span",
    constructor: function IconView(options = {}) {
      if (!options.model) {
        options.model = new Backbone.Model(_.pick(options, "iconName", "theme", "on", "size", "jatoButtonSize", "jatoButtonType", "jatoIconSize", "jatoIconType", "jatoIcon", "states", "grayscale", "filter", "colorTheme", "hoverStateByElement", "activeStateByElement", "focusStateByElement", "disabledStateByElement", "allStateByElement"));
      }
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    modelEvents: {
      change: "render"
    },
    render: function() {
      this._ensureViewIsIntact();
      this.triggerMethod("before:render", this);
      let model = this.model;
      let jatoIcon = model.get("jatoIcon");
      if (theming.isJATOTheme() && jatoIcon) {
        const createOtcIconEle = async () => {
          let otcBtnEle = await document.createElement("otc-button");
          otcBtnEle.setAttribute("iconappearance", "");
          otcBtnEle.setAttribute("size", model.get("jatoButtonSize") ?? "small");
          otcBtnEle.setAttribute("type", model.get("jatoButtonType") ?? "subtle");
          this.attachElContent(otcBtnEle);
          let otcIconEle = await document.createElement("otc-icon");
          otcIconEle.setAttribute("type", model.get("jatoIconType") ?? "subtle");
          otcIconEle.setAttribute("size", model.get("jatoIconSize") ?? "16");
          otcIconEle.setAttribute("svg", jatoIcon);
          otcBtnEle.appendChild(otcIconEle);
        };
        createOtcIconEle();
      } else {
        var svgHtml = iconRegistry.getIconByNameWithOptions(this.model.attributes);
        this.attachElContent(svgHtml);
        var sizeClass = iconRegistry.getClassForSize(this.model.attributes);
        this.$el.addClass(sizeClass);
      }
      this.isRendered = true;
      this.bindUIElements();
      this.triggerMethod("render", this);
      return this;
    },
    setIcon: function(iconName) {
      this.model.set("iconName", iconName);
    },
    setJatoIcon: function(jatoIcon) {
      this.model.set("jatoIcon", jatoIcon);
    },
    setIconStateIsOn: function(on) {
      this.model.set("on", on);
    }
  });
});