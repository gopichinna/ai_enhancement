/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/behaviors/keyboard.navigation/smart.tabable.region.behavior", "hbs!smart/controls/node.picker/impl/footer/apply.properties.selector/impl/apply.properties.selector", "i18n!smart/controls/node.picker/impl/footer/apply.properties.selector/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.action.icons", "css!smart/controls/node.picker/impl/footer/apply.properties.selector/impl/apply.properties.selector" ], function(_, $, Backbone, Marionette, TabableRegion, selectorTemplate, lang, theming, jatoIcons) {
  "use strict";
  var ApplyPropertiesSelectorView = Marionette.ItemView.extend({
    _applyOptions: [],
    selected: undefined,
    openSelectedProperties: false,
    className: "cs-apply-properties-selector binf-dropdown",
    template: selectorTemplate,
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegion
      }
    },
    ui: {
      toggle: ">.toggler",
      selectedLabel: ">.toggler >.cs-label",
      propertiesButton: "button.smart-inline-text-small-btn",
      menu: "otc-menu",
      menuItem: "otc-menucheckbox[data-optionid]",
      openSelectedProperties: "otc-menucheckbox.open-selected-properties"
    },
    events: {
      "click @ui.menuItem": "onClickPropertiesOption",
      "keydown @ui.menuItem": "onClickPropertiesOption",
      "click @ui.openSelectedProperties": "onClickOpenSelectedProperties",
      "keydown @ui.openSelectedProperties": "onClickOpenSelectedProperties",
      keydown: "onKeyInView"
    },
    constructor: function ApplyPropertiesSelectorView(options) {
      options || (options = {});
      _.defaults(options, {
        startSelection: options.defaultPropertySelector || options.applyPropertiesOptions?.[0]?.id
      });
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    onKeyInView: function(event) {
      let active = this.el.querySelector("otc-menu")["isOpen"];
      if (event.keyCode === 27 && active) {
        this.$('*[tabindex = "0"]').trigger("focus");
        return false;
      } else if (event.keyCode === 27 && !active) {
        this.options.masterView._dialog.canBeClosed = true;
        return true;
      }
    },
    onClickPropertiesOption: function(e) {
      e.preventDefault();
      if (e.type === "click" || e.type === "keydown" && (e.keyCode === 13 || e.keyCode === 32)) {
        this._setSelected(parseInt($(e.currentTarget).attr("data-optionid")));
        this._showSelected();
        this.ui.toggle[0]?.click();
        this.trigger("property:click:event");
        this.el?.querySelector(".toggler").focus();
      }
    },
    onClickOpenSelectedProperties: function(e) {
      e.preventDefault();
      if (e.type === "click" || e.type === "keydown" && (e.keyCode === 13 || e.keyCode === 32)) {
        this.openSelectedProperties = !this.openSelectedProperties;
        this._showOpenSelectedProperties();
        this.ui.toggle[0]?.click();
        this.el?.querySelector(".toggler").focus();
      }
    },
    initialize: function() {
      this._setupApplyOptions();
      if (-1 !== _.indexOf(_.pluck(this._applyOptions, "id"), this.options.selected)) {
        this._setSelected(this.options.selected);
      } else {
        this._setSelected(this.options.defaultPropertySelector || this._applyOptions[0]?.id);
      }
      this.listenTo(Backbone, "closeToggleAction", this._closeToggle);
    },
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        id: _.uniqueId("optionsDropdown"),
        applyPropertiesOptions: this._applyOptions,
        openSelectedProperties: lang.OpenSelectedProperties,
        showDivider: this._applyOptions?.length > 0,
        showOpenSelectedProperties: !this.options.hideOpenPropertiesPage,
        jatoDownArrowIconSvg: jatoIcons.actionChevronSmallDown
      };
    },
    currentlyFocusedElement: function() {
      return this.$el.find("otc-button");
    },
    accDeactivateTabableRegion: function() {
      if (!$(event?.target).closest(this.ui?.toggle).length) {
        this._closeToggle();
      }
    },
    onRender: function() {
      this._showSelected();
      this._showOpenSelectedProperties();
    },
    _getOptionName: function(opt) {
      var i;
      var name;
      i = _.indexOf(_.pluck(this._applyOptions, "id"), opt);
      name = i === -1 ? "" : this._applyOptions[i].name;
      return name;
    },
    _setupApplyOptions: function() {
      if (this.options?.applyPropertiesOptions?.length) {
        this._applyOptions = [ ...this.options.applyPropertiesOptions ];
      }
    },
    _setSelected: function(applyPropertiesOption) {
      this.selected = applyPropertiesOption;
    },
    _showSelected: function() {
      this.ui?.propertiesButton?.attr("aria-label", _.str.sformat(lang.ApplyPropertiesAria, this._getOptionName(this.selected)) || lang.DefaultPropertiesBtnAria);
      this.ui?.menu?.attr("arialabel", lang.DefaultButtonLabel);
      this.ui.selectedLabel.text(this._getOptionName(this.selected) || lang.DefaultButtonLabel);
      this.ui.selectedLabel.attr("aria-label", this._getOptionName(this.selected) || lang.DefaultButtonLabel);
      this.ui.menuItem?.toArray().forEach(item => {
        item?.removeAttribute("checked");
      });
      const currentSelectedItem = this.ui.menu?.find(`otc-menucheckbox[data-optionid="${this.selected}"]`);
      currentSelectedItem[0]?.setAttribute("checked", true);
    },
    _showOpenSelectedProperties: function() {
      if (this.openSelectedProperties === true) {
        this.ui.openSelectedProperties[0]?.setAttribute("checked", true);
      } else {
        this.ui.openSelectedProperties[0]?.removeAttribute("checked");
      }
    },
    _closeToggle: function() {
      if (this?.el?.querySelector("otc-menu")) {
        let active = this?.el?.querySelector("otc-menu")["isOpen"];
        if (active) {
          this.el?.querySelector("otc-menu")?.removeAttribute("isopen");
        }
      }
    }
  });
  return ApplyPropertiesSelectorView;
});