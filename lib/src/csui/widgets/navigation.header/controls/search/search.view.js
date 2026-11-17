/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/widgets/search.box/search.box.view", "csui/utils/contexts/factories/search.query.factory", "csui/controls/globalmessage/globalmessage" ], function(SearchBoxView, SearchQueryModelFactory, GlobalMessage) {
  "use strict";
  var SearchView = SearchBoxView.extend({
    constructor: function SearchView(options) {
      SearchBoxView.call(this, options);
      this.searchQuery = options.context.getModel(SearchQueryModelFactory);
    },
    onRender: function() {
      var resizetrigger = function() {
        GlobalMessage.trigger("resize");
      };
      this.listenTo(this, "hide:input", resizetrigger);
      this.listenTo(this, "show:input", resizetrigger);
    }
  });
  return SearchView;
});