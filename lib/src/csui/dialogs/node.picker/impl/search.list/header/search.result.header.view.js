/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette", "i18n!csui/dialogs/node.picker/impl/nls/lang", "hbs!csui/dialogs/node.picker/impl/search.list/header/search.result.header", "css!csui/dialogs/node.picker/impl/search.list/search.list" ], function(_, $, Marionette, lang, headerTemplate) {
  "use strict";
  var SearchResultHeaderView = Marionette.ItemView.extend({
    className: "csui-search-data-header",
    template: headerTemplate,
    templateHelpers: function() {
      var messages = {
        searchResults: lang.searchResults
      };
      return {
        messages: messages
      };
    },
    constructor: function SearchResultHeaderView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      var collection = this.collection;
      this.rendered = true;
      this.$el.show();
      this._assignTotalItemElem(collection);
    },
    _assignTotalItemElem: function(collection) {
      this.totalCount = 0;
      if (collection && collection.length > 0) {
        this.totalCount = collection.totalCount;
      }
      var listElem = this.$el.find(".searchHeaderCount"), txt = lang.searchFoundZero;
      if (this.totalCount !== null) {
        txt = _.str.sformat(lang.searchFoundAbout, this.totalCount);
      }
      listElem.empty();
      listElem.append(txt);
      return true;
    }
  });
  return SearchResultHeaderView;
});