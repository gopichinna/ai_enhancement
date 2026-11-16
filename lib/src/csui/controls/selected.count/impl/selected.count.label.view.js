/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette3", "hbs!csui/controls/selected.count/impl/selected.count.label", "i18n!csui/controls/selected.count/impl/nls/lang", "css!csui/controls/selected.count/impl/selected.count" ], function(_, Marionette, template, lang) {
  "use strict";
  let SelectedLabelView = Marionette.View.extend({
    tagName: "button",
    className: function() {
      let className = "binf-btn binf-btn-primary";
      if (this.options.showOnlyOnSelection && this.options.collection.length === 0) {
        className = " binf-hidden";
      }
      return className;
    },
    template: template,
    templateContext: function() {
      return {
        selectedCount: this.selectedCount,
        selectedLabel: lang.selectedLabel
      };
    },
    ui: {
      selectedCountValue: ".csui-selected-counter-value"
    },
    events: {
      click: "toggleSelectedCount"
    },
    attributes: function() {
      return {
        title: _.str.sformat(lang.selectedButtonTitle, this.selectedCount),
        "aria-label": _.str.sformat(lang.selectedButtonAria, this.selectedCount),
        "aria-haspopup": true
      };
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
      typeof this.ui.selectedCountValue?.text === "function" && this.ui.selectedCountValue?.text(updatedCount);
      this.el.ariaLabel = _.str.sformat(lang.selectedButtonAria, updatedCount);
      this.el.title = _.str.sformat(lang.selectedButtonTitle, updatedCount);
    },
    toggleSelectedCount: function() {
      if (this.options.parentView?.selectedItemsCollectionView?.isRendered) {
        this.options.parentView.selectedItemsCollectionView._hideItemView();
      } else {
        this.el.ariaExpanded = true;
        this.options.parentView.showSelectedDropdown();
      }
    },
    onDestroy: function() {
      this.stopListening(this.options.collection, "reset remove add");
    }
  });
  return SelectedLabelView;
});