/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette3", "hbs!csui/controls/perspective.actions/impl/perspective.action.dropdown.items", "css!csui/controls/perspective.actions/impl/perspective.action" ], function(Marionette, template) {
  "use strict";
  const PerspectiveSettingDropdownItems = Marionette.View.extend({
    template: template,
    tagName: "otc-menuitem",
    constructor: function PerspectiveSettingDropdownItems(options) {
      if (!options) {
        throw new Error("options object is mandatory for PerspectiveSettingDropdownItems");
      }
      Marionette.View.prototype.constructor.call(this, options);
    },
    events: {
      click: "onChanged",
      keydown: "onKeyInActionItem"
    },
    onChanged: function() {
      this.trigger("change:selection", this.options);
    },
    onKeyInActionItem: function(event) {
      switch (event.key) {
       case "Enter":
        this.onChanged();
        break;

       case "ArrowUp":
        if (this.$el.prev().length) {
          this.$el.prev()[0].focus();
        }
        break;

       case "ArrowDown":
        if (this.$el.next().length) {
          this.$el.next()[0].focus();
        }
        break;

       case "Tab":
        if (event.shiftKey && event.key === "Tab") {
          this._parent.ui.dropdownToggle.trigger("click");
        }
        break;

       case "Escape":
        this._parent.ui.dropdownToggle.trigger("click");
        this._parent.ui.dropdownToggle[0].focus();
        break;
      }
    }
  });
  return PerspectiveSettingDropdownItems;
});