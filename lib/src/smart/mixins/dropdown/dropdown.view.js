/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "hbs!smart/mixins/dropdown/dropdown", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "i18n!smart/mixins/dropdown/impl/nls/lang", "css!smart/mixins/dropdown/dropdown", "smart/utils/otwc.loader", "smart/themes/carbonfiber/ot-icons/icons_smart_action" ], function(_, $, Backbone, Marionette, TabableRegion, dropdownTemplate, theming, jatoIcons, lang) {
  var DropDownView = Marionette.ItemView.extend({
    tagName: "div",
    className: "smart-dropdown",
    template: dropdownTemplate,
    triggers: {
      click: "click"
    },
    ui: {
      dropdown: ".csui-dropdown",
      dropDownMenu: ".csui-dropdown > .binf-dropdown-toggle",
      dropDownList: ".csui-dropdown .smart-dropdown-menu",
      dropDownListItem: ".csui-dropdown .smart-dropdown-menu .smart-dropdown-menuitem"
    },
    events: {
      "click @ui.dropDownListItem": "onListClick",
      "keydown @ui.dropDownListItem": "onKeyDownView",
      "keyup @ui.dropDownListItem": "onKeyInView"
    },
    templateHelpers: function() {
      return {
        list: this.options.collection.models,
        moreButtonsAria: this.options.moreButtonsAria || lang.moreButtonsAria,
        size: this.footerView.size || "normal",
        state: this.footerView.state || "off",
        isJATO: theming.isJATOTheme(),
        forceOpenDir: this.options.forceOpenDir || "forceopenup",
        moreHorizontalSVGContent: jatoIcons.actionMoreHorizontal
      };
    },
    constructor: function DropDownView(options, footerView) {
      options || (options = {});
      Marionette.ItemView.apply(this, arguments);
      this.footerView = footerView;
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    currentlyFocusedElement: function(event) {
      var tabElements = this.$("*[tabindex]:not(.binf-disabled )");
      if (tabElements.length) {
        tabElements.prop("tabindex", 0);
      }
      return this.footerView.checkResizer && this.footerView.checkResizer(event) || $(tabElements[0]);
    },
    onKeyDownView: function(event) {
      this.footerView.isESC = false;
      if (event.keyCode === 13 || event.keyCode === 32) {
        event.preventDefault();
        event.stopPropagation();
        $(event.target).click();
      }
    },
    onKeyInView: function(event) {
      if (event.keyCode == 27) {
        event.preventDefault();
      }
    },
    onListClick: function(event) {
      event.preventDefault();
      event.stopPropagation();
      var i = this.ui.dropDownListItem.index(event.currentTarget);
      var ele = this.options.collection.models[i];
      if (ele.get("disabled")) {
        event.stopImmediatePropagation();
      } else {
        this.footerView.trigger("button:click button:click:" + ele.get("type"), ele.attributes);
      }
    }
  });
  return DropDownView;
});