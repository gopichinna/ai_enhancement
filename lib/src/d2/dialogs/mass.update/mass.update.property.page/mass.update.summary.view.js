/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/dialogs/mass.update/mass.update.property.page/mass.update.table.view", "hbs!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.summary", "i18n!d2/dialogs/mass.update/impl/nls/lang", "css!d2/dialogs/mass.update/mass.update.property.page/impl/mass.update.summary" ], function($, _, Marionette, PerfectScrollingBehavior, MassUpdateTableView, template, lang) {
  "use strict";
  var customMassUpdateTableView = MassUpdateTableView.extend({
    _renderTable: function() {
      MassUpdateTableView.prototype._renderTable.apply(this, arguments);
      var title = this.collection === this.options.added ? lang.added : this.collection === this.options.removed ? lang.removed : lang.changed;
      this.$el.find("thead tr").html(title);
      this.options.summaryView.addShowMore();
    },
    onTableRowRendered: function() {},
    showErrorLabel: function() {}
  });
  return Marionette.LayoutView.extend({
    className: "d2-mass-update-summary",
    template: template,
    templateHelpers: function() {
      return {
        summaryTitle: lang.summaryTitle,
        showMore: lang.showMore
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true
      }
    },
    regions: {
      region1: ".d2-mass-update-summary-region1",
      region2: ".d2-mass-update-summary-region2"
    },
    ui: {
      toggle1: ".d2-mass-update-summary-show-toggle1",
      toggle2: ".d2-mass-update-summary-show-toggle2"
    },
    events: {
      "click @ui.toggle1": "onFirstToggleClick",
      "click @ui.toggle2": "onSecondToggleClick",
      "keyup @ui.toggle1": "onFirstToggleKeyup",
      "keyup @ui.toggle2": "onSecondToggleKeyup"
    },
    constructor: function(options) {
      options = options || {};
      this.setupTableViews(options);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      this.showTableViews();
    },
    setupTableViews: function(options) {
      this.firstCollection = options.added || options.removed || options.changed;
      this.secondCollection = options.added ? options.removed || options.changed : options.removed ? options.changed : null;
      this.table1 = this.firstCollection ? new customMassUpdateTableView(_.extend({
        collection: this.firstCollection,
        mode: "view",
        summaryView: this
      }, options)) : null;
      this.table2 = this.secondCollection ? new customMassUpdateTableView(_.extend({
        collection: this.secondCollection,
        mode: "view",
        summaryView: this
      }, options)) : null;
    },
    isOverflowing: function() {
      var curOverflow = this.$el.css("overflow");
      this.$el.css("overflow", "hidden");
      var isOverflowing = this.el.clientHeight < this.el.scrollHeight;
      this.$el.css("overflow", curOverflow);
      return isOverflowing;
    },
    showTableViews: function() {
      this.table1 && this.region1.show(this.table1);
      this.table2 && this.region2.show(this.table2);
    },
    addShowMore: function() {
      this.count = this.count || 0;
      this.count++;
      if (this.table1 && this.table2 && this.count >= 2) {
        while (this.isOverflowing()) {
          var firstTableLarger = this.table1.$el.find("tbody tr:not(.binf-hidden)").length > this.table2.$el.find("tbody tr:not(.binf-hidden)").length, collection = firstTableLarger ? this.table1.collection : this.table2.collection, nonHiddenRows = firstTableLarger ? this.table1.$el.find("tbody tr:not(.binf-hidden)") : this.table2.$el.find("tbody tr:not(.binf-hidden)");
          $(nonHiddenRows[nonHiddenRows.length - 1]).addClass("binf-hidden");
          firstTableLarger ? this.ui.toggle1.removeClass("binf-hidden") : this.ui.toggle2.removeClass("binf-hidden");
          collection.hiddenCount = collection.hiddenCount || 0;
          collection.hiddenCount++;
        }
      }
      this.$el.perfectScrollbar("update");
    },
    onToggleClick: function(event, table, toggle) {
      event.stopPropagation();
      event.preventDefault();
      table.$el.find("tbody tr").slice(-table.collection.hiddenCount).toggleClass("binf-hidden");
      var toggleIcon = toggle.find(".toggle-icon");
      toggleIcon.toggleClass("more").toggleClass("less");
      toggle.html(toggleIcon.hasClass("more") ? lang.showMore : lang.showLess);
      toggle.append(toggleIcon);
      this.$el.perfectScrollbar("update");
    },
    onFirstToggleClick: function(event) {
      this.onToggleClick(event, this.table1, this.ui.toggle1);
    },
    onSecondToggleClick: function(event) {
      this.onToggleClick(event, this.table2, this.ui.toggle2);
    },
    onFirstToggleKeyup: function(event) {
      if (event.which === 13 || event.which === 32) {
        this.onToggleClick(event, this.table1, this.ui.toggle1);
      }
    },
    onSecondToggleKeyup: function(event) {
      if (event.which === 13 || event.which === 32) {
        this.onToggleClick(event, this.table2, this.ui.toggle2);
      }
    }
  });
});