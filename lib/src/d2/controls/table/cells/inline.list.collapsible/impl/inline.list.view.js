/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "hbs!d2/controls/table/cells/inline.list.collapsible/impl/inline.list", "i18n!d2/controls/table/cells/inline.list.collapsible/impl/nls/lang" ], function($, _, Marionette, InlineListViewTemplate, lang) {
  "use strict";
  var ListExpandView = Marionette.ItemView.extend({
    constructor: function ListExpandView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.$el.attr({
        tabindex: "-1",
        role: "button"
      });
    },
    triggers: {
      click: "expand:toggled"
    },
    events: {
      keydown: "onKeydown"
    },
    template: false,
    className: "inline-list-expand focusable-item",
    updateAttributes: function(buttonLabel) {
      this.$el.attr({
        title: buttonLabel,
        "aria-label": buttonLabel,
        tabindex: -1
      }).text(buttonLabel);
    },
    onKeydown: function(event) {
      if (event.which === 13 || event.which === 32) {
        this.trigger("expand:toggled", {}, true);
        event.preventDefault();
        event.stopPropagation();
      } else {
        this.options.parentView.triggerMethod("keydown:item", event);
      }
    }
  });
  return Marionette.ItemView.extend({
    constructor: function InlineListView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.expandView = new ListExpandView({
        parentView: this
      }).render();
      this.listenTo(this.expandView, "expand:toggled", this.onExpandToggled.bind(this));
    },
    className: "inline-list",
    template: InlineListViewTemplate,
    ui: {
      spanElement: ".inline-list-value"
    },
    isExpanded: function() {
      return this.$el.closest("tr").attr("row-expanded") === "true";
    },
    onExpandToggled: function() {
      var expanded = this.isExpanded();
      if (expanded) {
        this.$el.closest("tr").removeAttr("row-expanded");
      } else {
        this.$el.closest("tr").attr("row-expanded", true);
      }
      this.resetContent();
      if (expanded) {
        this.getWrapperColumnEl().focus();
      } else {
        this.$el.find(".focusable-item").first().trigger("focus");
      }
    },
    getHiddenItemCount: function() {
      return this.options.listItems.length - this.collection.length;
    },
    removeExcessItems: function() {
      var listViewWidth = this.getElementWidth(), wrapperColumnWidth = this.getWrapperColumnWidth();
      if (wrapperColumnWidth > 0 && listViewWidth > wrapperColumnWidth) {
        this.collection.pop();
        this.collection.reset(this.collection.models);
        this.setSpanElementText(this.getConcatenatedValue(this.collection.models));
        this.appendExpandButton(true);
      }
    },
    appendExpandButton: function(removeExcessesItems) {
      var buttonLabel = "";
      if (this.isExpanded()) {
        buttonLabel = lang.showLess;
      } else {
        var hiddenItemCount = this.getHiddenItemCount();
        buttonLabel = _.str.sformat(lang.showMore, hiddenItemCount);
      }
      this.expandView.updateAttributes(buttonLabel);
      this.$el.append(this.expandView.$el);
      this.ui.spanElement.attr("tabindex", -1);
      if (removeExcessesItems) {
        this.removeExcessItems();
      }
    },
    resetContent: function() {
      var $tableRowEl = this.$el.closest("tr");
      this.ui.spanElement.removeAttr("tabindex");
      this.expandView.$el.detach();
      $tableRowEl.removeClass("row-expanded");
      this.collection.reset(this.options.listItems);
      this.setSpanElementText(this.getConcatenatedValue(this.collection.models));
      if (this.isExpanded()) {
        var listViewWidth = this.getElementWidth(), wrapperColumnWidth = this.getWrapperColumnWidth();
        if (wrapperColumnWidth > 0 && listViewWidth > wrapperColumnWidth) {
          $tableRowEl.addClass("row-expanded");
          this.appendExpandButton(false);
        } else {
          $tableRowEl.removeAttr("row-expanded");
        }
      } else {
        this.removeExcessItems();
      }
    },
    getElementWidth: function() {
      var paddingLeft = $(this.$el).css("padding-left");
      return $(this.$el).width() + 2 * paddingLeft.substring(0, paddingLeft.length - 2);
    },
    getWrapperColumnWidth: function() {
      return $(this.getWrapperColumnEl()).width();
    },
    getWrapperColumnEl: function() {
      return this.options.cellView.el;
    },
    getConcatenatedValue: function(itemsArray) {
      var value = "";
      _.each(itemsArray, function(item, index) {
        value = index === 0 ? item.get("label") : _.str.sformat(lang.extendedPermissionsFormatter, value, item.get("label"));
      });
      return value;
    },
    setSpanElementText: function(value) {
      this.ui.spanElement.text(value);
    }
  });
});