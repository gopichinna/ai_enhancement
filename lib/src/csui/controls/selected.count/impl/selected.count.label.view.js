/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "hbs!csui/controls/selected.count/impl/selected.count.label", "i18n!csui/controls/selected.count/impl/nls/lang", "smart/themes/theming", "css!csui/controls/selected.count/impl/selected.count" ], function(_, Marionette, template, lang, theming) {
  "use strict";
  let SelectedLabelView = Marionette.View.extend({
    tagName: "otc-button",
    className: function() {
      let className = "";
      if (this.options.showOnlyOnSelection && this.options.collection.length === 0) {
        className = " binf-hidden";
      }
      return className;
    },
    attributes: function() {
      return {
        type: "subtleDropdown",
        id: this.options.btnId,
        tabindex: "-1",
        arialabel: _.str.sformat(lang.selectedButtonAria, this.selectedCount),
        size: "regular",
        role: "menu"
      };
    },
    template: template,
    templateContext: function() {
      return {
        isJATO: theming.isJATOTheme(),
        selectedCount: this.selectedCount,
        selectedLabel: lang.selectedLabel
      };
    },
    ui: {
      selectedCountValue: ".csui-selected-counter-value"
    },
    events: {
      click: "toggleSelectedCount",
      keydown: "onKeyInView"
    },
    constructor: function SelectedLabelView(options) {
      options = _.defaults(options.parentView.options, {
        showOnlyOnSelection: true
      });
      this.options = options;
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.selectedCount = this.options.collection.length;
      this.listenTo(this.options.collection, "reset remove add", function() {
        this.updateCounter();
      });
    },
    updateCounter: function() {
      const updatedCount = this.options.collection.length;
      if (updatedCount === 0) {
        this.el.classList.add("binf-hidden");
        return;
      }
      this.el.classList.contains("binf-hidden") && this.el.classList.remove("binf-hidden");
      this.el.querySelector("otc-badge").value = updatedCount.toString();
      this.el.ariaLabel = _.str.sformat(lang.selectedButtonAria, updatedCount);
      this.el.title = _.str.sformat(lang.selectedButtonTitle, updatedCount);
    },
    toggleSelectedCount: function() {
      this.el.ariaExpanded = true;
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
    },
    onDestroy: function() {
      this.stopListening(this.options.collection, "reset remove add");
    }
  });
  return SelectedLabelView;
});