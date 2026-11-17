/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "i18n!smart/controls/node.picker/impl/nls/lang" ], function(_, $, Marionette, SmartTabableRegion, theming, jatoIcons, lang) {
  var TogglerButtonView = Marionette.ItemView.extend({
    template: false,
    className: "smart-view-toggler",
    tagName: "otc-button",
    events: {
      click: "toggleMode",
      keydown: "toggleModeonKeyDown"
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: SmartTabableRegion
      }
    },
    onRender: function() {
      if (theming.isJATOTheme()) {
        var otcIconEle = document.createElement("otc-icon");
        this.el.appendChild(otcIconEle);
      }
    },
    constructor: function TogglerButtonView(options = {}) {
      this.options = options || {};
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    currentlyFocusedElement: function() {
      if (this.options?.masterView?.isKeyEvent) {
        return this.$el;
      }
    },
    _setToggleButton: function() {
      let icon = "smart_action:action_switch_list32", jatoToggleIcon = jatoIcons.actionList, arialabel = lang.switchToListAria, title = lang.switchToListTitle;
      if (!this.options?.masterView?.isGridView()) {
        icon = "smart_action:action_switch_thumb32";
        jatoToggleIcon = jatoIcons.actionViewGallery;
        arialabel = lang.switchToThumbnailAria;
        title = lang.switchToThumbnailTitle;
      }
      if (theming.isJATOTheme()) {
        this.el.setAttribute("size", "small");
        this.el.querySelector("OTC-ICON").setAttribute("svg", jatoToggleIcon);
      } else {
        this.el.setAttribute("icon", icon);
      }
      this.el.setAttribute("arialabel", arialabel);
      this.el.setAttribute("title", title);
    },
    toggleMode: function(event) {
      let gridFlag = !this.options?.masterView?.isGridView();
      this.options?.masterView?.trigger("toggle:thumbnail:view", gridFlag);
      this._setToggleButton();
    },
    toggleModeonKeyDown: function(event) {
      switch (event.keyCode) {
       case 32:
       case 13:
        event.stopPropagation();
        event.preventDefault();
        this.toggleMode(event);
        break;
      }
    },
    onShow: function() {
      this._setToggleButton();
    }
  });
  return TogglerButtonView;
});