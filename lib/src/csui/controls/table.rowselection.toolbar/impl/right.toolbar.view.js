/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "hbs!csui/controls/table.rowselection.toolbar/impl/right.toolbar", "i18n!csui/controls/table.rowselection.toolbar/impl/nls/localized.strings", "smart/themes/theming", "csui/themes/csui.jato.action.icons", "css!csui/controls/table.rowselection.toolbar/impl/right.toolbar" ], function(_, $, Marionette, ViewEventsPropagationMixin, TabableRegionBehavior, template, lang, theming, jatoIcons) {
  "use strict";
  var RightToolbarView = Marionette.ItemView.extend({
    className: "csui-right-toolbar-view",
    template: template,
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        iconName: "",
        iconSVG: jatoIcons.actionShowToolbar,
        showCondensedHeaderToggle: this.options.showCondensedHeaderToggle,
        toggleCondensedHeaderTooltip: lang.showCondensedHeaderTooltip,
        toggleCondensedHeaderAria: lang.showCondensedHeaderAria
      };
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },
    ui: {
      condensedHeaderToggleButton: ".csui-condensed-header-toggle",
      condensedHeaderToggleIcon: ".icon-condensed-header",
      condensedHeaderToggleIconSVG: ".icon-condensed-header-svg"
    },
    events: {
      keydown: "onKeyInView",
      keyup: "keyUpHandler",
      "click .csui-condensed-header-toggle-container": "onClickCondensedHeaderToggle"
    },
    constructor: function RightToolbarView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._toolbarVisible = false;
    },
    onRender: function() {
      this.delegateEvents();
    },
    onToolbarActivity: function(toolbarVisible, headerVisible) {
      this._toolbarVisible = toolbarVisible;
      const {
        showCondensedHeaderToggle
      } = this.options;
      const {
        condensedHeaderToggleButton,
        condensedHeaderToggleIcon,
        condensedHeaderToggleIconSVG
      } = this.ui;
      if (showCondensedHeaderToggle && condensedHeaderToggleButton.length === 1) {
        condensedHeaderToggleButton.attr("tabindex", toolbarVisible ? "0" : "-1");
        const isJATOTheme = theming.isJATOTheme();
        const rotationClass = "icon-rotate180";
        const marginRight = "8px";
        const ariaLabel = headerVisible ? lang.hideCondensedHeaderAria : lang.showCondensedHeaderAria;
        const tooltip = headerVisible ? lang.hideCondensedHeaderTooltip : lang.showCondensedHeaderTooltip;
        condensedHeaderToggleIcon.toggleClass(rotationClass, headerVisible);
        const ariaLabelAttrName = condensedHeaderToggleButton[0].tagName.startsWith("OTC-") ? "arialabel" : "aria-label";
        condensedHeaderToggleButton.attr({
          [ariaLabelAttrName]: ariaLabel,
          title: tooltip
        });
        if (isJATOTheme) {
          condensedHeaderToggleIconSVG.toggleClass(rotationClass, headerVisible);
          condensedHeaderToggleButton.css({
            display: "flex",
            "margin-right": marginRight,
            "align-items": "center"
          });
        }
      }
    },
    onClickCondensedHeaderToggle: function(event) {
      this.trigger("toggle:condensed:header");
      this.ui.condensedHeaderToggleButton.trigger("focus");
    },
    currentlyFocusedElement: function() {
      if (this._toolbarVisible) {
        return this.ui.condensedHeaderToggleButton;
      } else {
        return $();
      }
    },
    onKeyInView: function(event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        $(event.target).trigger("click");
      }
    },
    keyUpHandler: function(event) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
      if (event.keyCode == 32 && isFirefox) {
        event.stopPropagation();
        event.preventDefault();
      }
    }
  });
  _.extend(RightToolbarView.prototype, ViewEventsPropagationMixin);
  return RightToolbarView;
});