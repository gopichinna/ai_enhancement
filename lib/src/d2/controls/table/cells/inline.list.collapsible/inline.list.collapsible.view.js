/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/table/cells/templated/templated.view", "csui/controls/table/cells/cell.registry", "d2/controls/table/cells/inline.list.collapsible/impl/inline.list.view", "css!d2/controls/table/cells/inline.list.collapsible/impl/inline.list" ], function($, _, Backbone, Marionette, TemplatedCellView, cellViewRegistry, InlineListView) {
  "use strict";
  var InlineListCellView = TemplatedCellView.extend({
    constructor: function InlineListCellView() {
      TemplatedCellView.prototype.constructor.apply(this, arguments);
    },
    events: {
      keydown: "_onKeyDown"
    },
    getValueText: function() {
      return this.model.get(this.options.column.attributes.column_key);
    },
    renderValue: function() {
      var tableView = this.options && this.options.tableView, columnName = this.options && this.options.column && this.options.column.attributes.items_array, listItems = this.model.get(columnName);
      if (listItems && listItems.length > 0) {
        var inlineListView = new InlineListView({
          collection: new Backbone.Collection(),
          listItems: listItems,
          cellView: this
        });
        inlineListView.render();
        this.$el.html(inlineListView.$el);
        if (tableView) {
          this.listenTo(tableView, "dom:refresh", function() {
            inlineListView.resetContent();
          });
        }
      }
    },
    _onKeyDown: function(event) {
      var eventKeyCode = event.charCode || event.which;
      switch (eventKeyCode) {
       case 13:
       case 32:
        var focusable = this.$el.find(".focusable-item").first();
        focusable.trigger("focus");
        break;

       default:
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }
  }, {
    widthFactor: 2,
    columnClassName: "d2-table-cell-inline-list-collapsible has-focusable-items"
  });
  cellViewRegistry.registerByColumnKey("extendedpPermissionsTranslatedString", InlineListCellView);
  return InlineListCellView;
});