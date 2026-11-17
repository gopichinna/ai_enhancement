/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "csui/lib/backbone", "csui/utils/log", "csui/utils/base" ], function(module, _, $, Marionette, Backbone, log, base) {
  "use strict";
  log = log(module.id);
  return {
    _hasIcon: function() {
      return this.model.get("iconName") || this._iconName || this._icon;
    },
    _calculateIconName: function() {
      this._stateIsOn = this.model.get("stateIsOn");
      if (this._stateIsOn) {
        this._iconName = this.model.get("iconNameForOn");
        if (this._iconName) {
          this._stateIsOn = false;
        } else {
          this._iconName = this.model.get("iconName");
        }
      } else {
        this._iconName = this.model.get("iconName");
        if (!this._iconName) {
          this._icon = this.model.get("icon");
        }
      }
    },
    renderIconAndText: function() {
      this.options.renderIconAndText = true;
      this.render();
      this.options.renderIconAndText = false;
    },
    renderTextOnly: function(saveState) {
      if (this.isRenderedTextOnly()) {
        return;
      }
      saveState && this.saveRenderState();
      this.options.renderTextOnly = true;
      this.render();
      this.options.renderTextOnly = false;
    },
    isRenderedTextOnly: function() {
      return !this._hasIcon() || this.options.renderTextOnly === true && this.options.renderIconAndText !== true;
    },
    makeFocusable: function() {
      this.ui.link.addClass("csui-acc-focusable");
    },
    _handleClick: function(event, isKeyEvent = false) {
      if (base.isControlClick(event)) {} else {
        event.preventDefault();
        if (this.model.get("menuWithMoreOptions") === true) {
          event.stopPropagation();
        } else {
          this.closeDropdown();
        }
        this.model.set({
          isKeyEvent: isKeyEvent
        }, {
          silent: true
        });
        var args = {
          toolItem: this.model
        };
        this.triggerMethod("before:toolitem:action", args);
        if (!args.cancel) {
          this.triggerMethod("toolitem:action", args);
        }
      }
    },
    isSeparator: function() {
      return this.model.isSeparator();
    },
    closeDropdown: function() {
      var dropdownEl = this.$el.closest("li.binf-dropdown.binf-open");
      var dropdownToggleEl = dropdownEl.find(".binf-dropdown-toggle");
      dropdownToggleEl.binf_dropdown("toggle");
    },
    closeSubMenu: function() {
      var subMenuEl = this.$el.closest(".binf-dropdown-submenu");
      if (subMenuEl && subMenuEl.length) {
        subMenuEl.binf_dropdown_submenu("hide");
      }
    }
  };
});