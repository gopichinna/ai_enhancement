/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/mixins/view.state/toolitems.state.mixin", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "smart/themes/theming", "smart/controls/icons.v2/icons.v2", "csui/lib/binf/js/binf" ], function(i18n, $, _, Backbone, Marionette, ToolItemsStateMixin, TabableRegionBehavior, theming, IconsV2) {
  "use strict";
  var OTCToolItemView = Marionette.ItemView.extend({
    tagName: function() {
      return "otc-toolbaritem";
    },
    className: function() {
      let className = `csui-toolitem ${this.model.get("className") || ""}`;
      if (this.model.isSeparator()) {
        className += " binf-divider";
      }
      return className;
    },
    attributes: function() {
      const toolItemName = this.model.get("name");
      let attrs = {
        title: toolItemName,
        arialabel: toolItemName
      };
      if (this.model.get("iconSVG") && theming.isJATOTheme() && !this.model.isSeparator()) {
        attrs["type"] = "subtle";
        attrs["size"] = "24";
        attrs["tabindex"] = "-1";
        attrs["svg"] = this.model.get("iconSVG");
        attrs["value"] = toolItemName;
      } else {
        attrs["value"] = toolItemName;
        attrs["icon"] = IconsV2.getSmartIconNameByV2IconName(this.model.get("iconName"));
        attrs["iconappearance"] = this.options.useIconsForDarkBackground ? "light" : "dark";
      }
      const signature = this.model.get("signature") || "";
      attrs["data-csui-command"] = signature.toLowerCase();
      if (signature.toLowerCase() === "add") {
        attrs["data-csui-addtype"] = this.model.get("commandData").type;
      }
      if (this.model.isSeparator()) {
        attrs["title"] = "";
        attrs["arialabel"] = "";
      }
      return attrs;
    },
    template: false,
    events: {
      click: "_handleClick",
      keydown: "onKeyInView"
    },
    constructor: function OTCToolItemView(options) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this._tagName = this.tagName();
      this.listenTo(this.model, "change:stateIsOn", function() {
        if (this._renderState) {
          this.renderTextOnly();
        } else {
          this.render();
        }
        this.makeFocusable();
      });
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        this._handleClick(event, true);
        return false;
      }
    },
    saveRenderState: function() {
      this._renderState = {};
      _.each(OTCToolItemView.STATE_PARAMS, function(param) {
        this._renderState[param] = this.options[param];
      }, this);
    },
    restoreRenderState: function() {
      if (this._renderState) {
        _.each(OTCToolItemView.STATE_PARAMS, function(param) {
          this.options[param] = this._renderState[param];
        }, this);
        this.render();
        delete this._renderState;
      }
    },
    onBeforeRender: function() {
      var hasFocusA = this.$el;
      this.itemHadFocus = hasFocusA.length === 1;
      this._iconName = this.model.get("iconName");
    },
    onRender: function() {
      if (this.itemHadFocus) {
        var theA = this.$el;
        theA.attr("tabindex", 0);
        theA.addClass([ TabableRegionBehavior.accessibilityFocusableClass, TabableRegionBehavior.accessibilityActiveElementClass ]);
        theA[0].focus();
        this.itemHadFocus = false;
      }
    }
  }, {
    STATE_PARAMS: [ "renderIconAndText", "renderTextOnly" ]
  });
  _.extend(OTCToolItemView.prototype, ToolItemsStateMixin);
  return OTCToolItemView;
});