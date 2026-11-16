/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/utils/base" ], function($, _, Marionette, base) {
  "use strict";
  var DropdownMenuBehavior = Marionette.Behavior.extend({
    ui: {
      dropdownMenu: ".binf-dropdown"
    },
    events: {
      "show.binf.dropdown": "onShowDropdownRefilterMenuItems",
      keydown: "onKeyInMenuView",
      keyup: "onKeyUpMenuView"
    },
    constructor: function DropdownMenuBehavior(options, view) {
      options = _.defaults(options, {
        refilterOnShow: true
      });
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this.view.dropdownMenuBehavior = this;
      this.listenTo(this, "refresh:dropdown", this.onDomRefresh);
    },
    onRender: function() {
      this.onDomRefresh();
    },
    onDomRefresh: function() {
      this.$dropdown = this.$el;
      if (this.options.dropdownSelector) {
        this.$dropdown = this.$el.find(this.options.dropdownSelector);
      }
      this.$dropdownToggle = this.$dropdown.find(".binf-dropdown-toggle");
    },
    onShowDropdownRefilterMenuItems: function() {
      this.options.refilterOnShow && this.view.options.collection.refilter && this.view.options.collection.refilter();
    },
    onKeyUpMenuView: function(event) {
      if (base.isFirefox()) {
        if (event.keyCode === 32) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
      if (event.keyCode === 27) {
        this._closeMenu(event);
      }
    },
    onKeyInMenuView: function(event) {
      const originEventType = event?.type;
      switch (event.keyCode) {
       case 9:
        this._closeMenu();
        break;

       case 13:
        event.stopPropagation();
        if (!base.isFirefox()) {
          event.preventDefault();
          $(event.target).trigger("click", originEventType);
        }
        break;

       case 32:
        event.preventDefault();
        event.stopPropagation();
        $(event.target).trigger("click", originEventType);
        break;

       case 27:
        if (this.$dropdown.hasClass("binf-open") || this.ui.dropdownMenu.hasClass("binf-open")) {
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
    },
    _closeMenu: function(event) {
      if (this.$dropdown.hasClass("binf-open") || this.ui.dropdownMenu.hasClass("binf-open")) {
        event && event.preventDefault();
        event && event.stopPropagation();
        this.$dropdownToggle.binf_dropdown("toggle");
        this.$dropdownToggle.trigger("focus");
      }
    }
  });
  return DropdownMenuBehavior;
});