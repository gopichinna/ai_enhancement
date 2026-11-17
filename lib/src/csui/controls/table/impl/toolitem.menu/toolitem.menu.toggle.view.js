/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette3", "smart/themes/theming", "csui/controls/icons.v2", "hbs!csui/controls/table/impl/toolitem.menu/impl/toolitem.menu.toggle", "css!csui/controls/table/impl/toolitem.menu/impl/toolitem.menu.toggle" ], function(Marionette, theming, iconRegistry, template) {
  "use strict";
  const ToolItemMenuToggleView = Marionette.View.extend({
    tagName: function() {
      return theming.isJATOTheme() ? "otc-button" : "button";
    },
    className: "csui-toolitem-menu-toggle",
    template: template,
    attributes: function() {
      const attrs = {
        id: `${this.cid}-button`,
        title: this.options.dropDownText,
        tabindex: "0"
      };
      if (theming.isJATOTheme()) {
        return {
          ...attrs,
          type: "subtle",
          size: this.options.dropDownButtonSize,
          ariaexpanded: "false",
          ariahaspopup: "true",
          arialabel: this.options.dropDownAria
        };
      } else {
        return {
          ...attrs,
          "aria-expanded": "false",
          "aria-haspopup": "true",
          "aria-label": this.options.dropDownAria
        };
      }
    },
    constructor: function ToolItemMenuToggleView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.call(this, options);
      this._boundClick = this._onClick.bind(this);
      this._boundKeydown = this._onKeydown.bind(this);
      this.el.addEventListener("click", this._boundClick, true);
      this.el.addEventListener("keydown", this._boundKeydown, true);
    },
    onDestroy: function() {
      this.el.removeEventListener("click", this._boundClick, true);
      this.el.removeEventListener("keydown", this._boundKeydown, true);
    },
    templateContext: function() {
      const isJatoTheme = theming.isJATOTheme();
      const dropDownIconNameSVG = !isJatoTheme && iconRegistry.getIconByNameWithOptions({
        iconName: this.options.dropDownIconName,
        theme: this._useIconsForDarkBackground ? "dark" : "",
        states: true
      });
      return {
        isJatoTheme: isJatoTheme,
        dropDownIconSVG: isJatoTheme && this.options.dropDownIconSVG,
        dropDownIconNameSVG: dropDownIconNameSVG
      };
    },
    _onKeydown: function(event) {
      switch (event.keyCode) {
       case 40:
       case 32:
       case 13:
        this.trigger("toggleByKey", event);
        break;
      }
    },
    _onClick: function(event) {
      this.trigger("toggleByClick", event);
    }
  });
  return ToolItemMenuToggleView;
});