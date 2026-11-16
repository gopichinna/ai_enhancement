/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "hbs!csui/controls/table/cells/search/search.cell/impl/search.cell.item" ], function(_, $, Marionette, template) {
  "use strict";
  var SearchCellPopoverItemView = Marionette.ItemView.extend({
    className: "csui-search-cell-item",
    tagName: "li",
    template: template,
    templateHelpers: function() {
      return {
        value: this.model && this.model.has("value_formatted") && this.model.get("value_formatted")
      };
    },
    attributes: {
      role: "none"
    },
    events: {
      "keydown .csui-search-cell-value": "accessibility"
    },
    constructor: function SearchCellPopoverItemView(options) {
      options || (options = {});
      this.options = options;
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    accessibility: function(event) {
      var el;
      event.preventDefault();
      event.stopPropagation();
      this.$el.find(".csui-search-cell-value").prop("tabindex", -1);
      switch (event.keyCode) {
       case 38:
        if (this.$el.prev().length) {
          this.$el.prev().find(".csui-search-cell-value").prop("tabindex", 0).trigger("focus");
        } else {
          el = this.options.parentView.$el.find(".csui-search-cell-value");
          $(el[el.length - 1]).prop("tabindex", 0).trigger("focus");
        }
        break;

       case 40:
        if (this.$el.next().length) {
          this.$el.next().find(".csui-search-cell-value").prop("tabindex", 0).trigger("focus");
        } else {
          el = this.options.parentView.$el.find(".csui-search-cell-value");
          $(el[0]).prop("tabindex", 0).trigger("focus");
        }
        break;

       case 27:
        var searchMetadata = this.options.originatingView.popoverEl.closest(".csui-search-metadata-value");
        searchMetadata.length ? searchMetadata.trigger("focus") : this.options.originatingView.$el.trigger("focus");
        this.options.originatingView.closePopover();
        break;
      }
    }
  });
  return SearchCellPopoverItemView;
});