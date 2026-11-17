/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "smart/controls/app.header/search/slices/slice.item.view", "i18n!smart/controls/app.header/search/impl/nls/lang" ], function(module, _, $, Marionette, SliceItemView, lang) {
  let SearchBoxsliceCollView = Marionette.CollectionView.extend({
    tagName: "otc-menugroup",
    className: "sliceContainer",
    childView: SliceItemView,
    childViewOptions: function() {
      return {
        leadingView: this.options.leadingView
      };
    },
    attributes: function() {
      let attr = {
        name: lang.searchWithinText,
        allowdeselection: true
      };
      return attr;
    },
    constructor: function SearchBoxsliceCollView(options = {}) {
      Marionette.CollectionView.apply(this, arguments);
      this.listenTo(this, "reorder:collection", this._reorder);
      this._reorder();
    },
    _reorder: function() {
      let selectedSlice = this?.options?.leadingView?.otcData?.selectedSlice ?? "", original_index = this.collection.findIndex({
        id: selectedSlice
      }), new_index = 0;
      if (new_index !== original_index) {
        var temp = this.collection.at(original_index);
        this.collection.remove(temp);
        this.collection.add(temp, {
          at: new_index
        });
      } else {}
      return this;
    }
  });
  return SearchBoxsliceCollView;
});