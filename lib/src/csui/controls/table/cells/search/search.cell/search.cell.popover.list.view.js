/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/marionette", "csui/controls/table/cells/search/search.cell/search.cell.popover.item.view", "hbs!csui/controls/table/cells/search/search.cell/impl/search.cell.list" ], function(_, Marionette, SearchCellPopoverItemView, template) {
  "use strict";
  var SearchCellPopoverListView = Marionette.CompositeView.extend({
    className: "csui-search-cell-collection",
    template: template,
    childViewContainer: ".csui-search-cell-list",
    childView: SearchCellPopoverItemView,
    childViewOptions: function() {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this
      };
    },
    constructor: function SearchCellPopoverListView(options) {
      options || (options = {});
      this.options = options;
      this.collection = options.collection;
      this.originatingView = options.originatingView;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    }
  });
  return SearchCellPopoverListView;
});