/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette3", "hbs!smart/controls/bulk.selection/impl/bulk.selection.count.label", "i18n!smart/controls/bulk.selection/impl/nls/lang", "smart/themes/theming" ], function(_, Marionette, template, lang, theming) {
  "use strict";
  let BulkSelectedLabelView = Marionette.View.extend({
    tagName: "otc-button",
    className: function() {
      let className = "";
      if (this.collection.length === 0) {
        className = " binf-hidden";
      }
      return className;
    },
    attributes: function() {
      return {
        type: theming.isJATOTheme() ? "subtleDropdown" : "inline",
        id: this.options.btnId,
        tabindex: "0",
        size: theming.isJATOTheme() ? "small" : "regular"
      };
    },
    template: template,
    templateContext: function() {
      return {
        isJATO: theming.isJATOTheme(),
        selectedCount: this.selectedCount,
        selectedLabel: this.options.buttonText || lang.buttonText
      };
    },
    ui: {
      selectedCountValue: "otc-badge"
    },
    events: {
      click: "toggleSelectedCount",
      keydown: "onKeyInView"
    },
    constructor: function BulkSelectedLabelView() {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.selectedCount = this.collection.length;
      this.listenTo(this.collection, "reset remove add", function() {
        this.updateCounter();
      });
    },
    updateCounter: function() {
      const updatedCount = this.collection.length;
      this.ui.selectedCountValue.prop("value", updatedCount.toString());
      if (updatedCount === 0) {
        this.el.classList.add("binf-hidden");
        return;
      }
      this.el.classList.contains("binf-hidden") && this.el.classList.remove("binf-hidden");
    },
    toggleSelectedCount: function() {
      this.el.ariaExpanded = !this.el.ariaExpanded;
    },
    onKeyInView: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.toggleSelectedCount();
        break;

       case 37:
       case 39:
        event.stopPropagation();
        break;
      }
    }
  });
  return BulkSelectedLabelView;
});