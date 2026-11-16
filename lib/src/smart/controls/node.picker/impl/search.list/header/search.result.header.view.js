/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "i18n!smart/controls/node.picker/impl/nls/lang", "hbs!smart/controls/node.picker/impl/search.list/header/search.result.header", "css!smart/controls/node.picker/impl/search.list/search.list" ], function(_, $, Marionette, lang, headerTemplate) {
  "use strict";
  var SearchResultHeaderView = Marionette.ItemView.extend({
    className: "csui-search-data-header",
    template: headerTemplate,
    templateHelpers: function() {
      var messages = {
        searchResults: _.str.sformat(lang.searchResults, this.options.searchTitleName)
      };
      return {
        messages: messages
      };
    },
    constructor: function SearchResultHeaderView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "update:header:text", this._updateHeader);
    },
    _updateHeader: function() {
      this.totalCount = 0;
      if (this.options?.collection?.length > 0) {
        this.totalCount = this.options.collection.totalCount;
      }
      let listElem = this.$el.find(".searchHeaderCount"), txt;
      if (this.totalCount !== null) {
        txt = _.str.sformat(lang.itemCount, this.totalCount);
      }
      listElem.empty();
      listElem.append(txt);
      let searchResults = _.str.sformat(lang.searchResults, this.options.searchTitleName);
      let anouncementText = [ txt, searchResults ].join(" ");
      this.options.masterView.trigger("make:anouncement", {
        message: anouncementText
      });
    }
  });
  return SearchResultHeaderView;
});