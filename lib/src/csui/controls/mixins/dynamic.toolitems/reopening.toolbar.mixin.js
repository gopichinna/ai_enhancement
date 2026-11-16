/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "nuc/lib/underscore", "nuc/utils/log" ], function(module, $, _, log) {
  "use strict";
  log = log(module.id);
  var ToolbarReopenMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeReopeningToolbar: function(options) {
          this.listenTo(this.collection, "before:reset remain", this._initReopenAfterAdjust);
        },
        _initReopenAfterAdjust: function(collection, {
          models
        } = {}) {
          var opened, dropdown;
          var afterAdjustEvent = this.options.afterAdjustEvent || "after:adjust";
          if (models && models.length > 0) {
            this.children.find(child => {
              if (child.model.get("name") && child.el.matches(".binf-dropdown-submenu.binf-open")) {
                opened = child.model.pick("name");
                return true;
              }
            });
            dropdown = this.el.querySelector("ul > li.binf-dropdown");
            if (dropdown && dropdown.classList.contains("binf-open")) {
              opened = opened || {};
              opened.dropdown = true;
            }
            if (opened) {
              this.listenToOnce(this, afterAdjustEvent, reopenToolItem);
            }
          }
          function reopenToolItem() {
            this.stopListening(this, afterAdjustEvent, reopenToolItem);
            var subitem = opened.name && this.children.find(child => {
              return child.model.get("name") === opened.name && child.el.classList.contains("binf-dropdown-submenu");
            });
            var dropdown = this.el.querySelector("ul > li.binf-dropdown");
            if (dropdown && !dropdown.classList.contains("binf-open")) {
              if (subitem ? dropdown.contains(subitem.el) : opened.dropdown) {
                var dropdownToggler = this.$el.find("li.binf-dropdown > a.binf-dropdown-toggle");
                dropdownToggler.trigger("binf.dropdown.before.show");
                dropdown.classList.add("binf-open");
                dropdownToggler.attr("aria-expanded", "true");
                dropdownToggler.trigger("binf.dropdown.after.show");
              }
            }
            if (subitem && !subitem.el.classList.contains("binf-open")) {
              subitem.$el.binf_dropdown_submenu().data("binf.dropdown.submenu").show($.Event("click", {
                which: 1
              }));
            }
          }
        }
      });
    }
  };
  return ToolbarReopenMixin;
});