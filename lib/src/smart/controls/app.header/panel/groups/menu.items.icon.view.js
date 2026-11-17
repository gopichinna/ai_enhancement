/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "smart/themes/theming" ], function($, _, Marionette, theming) {
  "use strict";
  let MenuItemIconView = Marionette.View.extend({
    tagName: "otc-icon",
    template: false,
    attributes: function() {
      let isJATO = theming.isJATOTheme();
      let jatoIcon = this?.model?.get("jatoIcon") ?? "";
      let CFIcon = this?.model?.get("icon") ?? "";
      let icon = isJATO ? jatoIcon : CFIcon;
      let attrs = {};
      if (isJATO) {
        attrs.svg = icon;
      } else {
        attrs.icon = icon;
      }
      let ItemIconAppearance;
      let isActiveFun = this.model.get("isActive");
      let isActive = false;
      if (_.isFunction(isActiveFun) && !this?.options?.isGroup) {
        isActive = this.options?.isActiveFunc(this.model);
      }
      let isBrightness;
      isBrightness = this.options?.panelView?.isBrightness;
      ItemIconAppearance = isBrightness ? "dark" : "light";
      if (isActive) {
        ItemIconAppearance = ItemIconAppearance == "light" ? "dark" : "light";
      }
      ItemIconAppearance = this?.model?.get("iconAppearance") ?? ItemIconAppearance;
      if (!isJATO) {
        attrs.iconappearance = ItemIconAppearance;
      }
      attrs.ispresentation = "";
      attrs.disableeffects = "";
      return attrs;
    },
    constructor: function MenuItemIconView(options = {}) {
      Marionette.View.prototype.constructor.apply(this, arguments);
    }
  });
  return MenuItemIconView;
});