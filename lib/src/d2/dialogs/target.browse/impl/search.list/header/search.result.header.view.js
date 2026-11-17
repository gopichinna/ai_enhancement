/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "i18n!d2/dialogs/target.browse/impl/nls/lang", "hbs!d2/dialogs/target.browse/impl/search.list/header/search.result.header", "d2/server.adaptors/models/widget/favorites/favorites.model", "csui/models/widget/search.results/search.results.model", "d2/dialogs/target.browse/start.locations/related.files/impl/related.files.collection", "d2/models/workflow/workflow.templates.collection", "css!d2/dialogs/target.browse/impl/search.list/search.list" ], function(_, $, Marionette, lang, headerTemplate, FavoriteCollection, SearchResultCollection, RelatedFilesCollection, WorkflowTemplatesCollection) {
  "use strict";
  var SearchResultHeaderView = Marionette.ItemView.extend({
    className: "d2-search-data-header",
    template: headerTemplate,
    templateHelpers: function() {
      var moreRecordTitle = "";
      var messages = {
        searchResults: lang.searchInProgress
      };
      if (this.collection instanceof FavoriteCollection) {
        messages = {
          searchResults: lang.favResults
        };
      }
      if (this.collection instanceof RelatedFilesCollection) {
        messages = {
          searchResults: lang.RelatedFilesResults
        };
      }
      if (this.collection instanceof WorkflowTemplatesCollection) {
        messages = {
          searchResults: lang.WorkflowTemplatesResults
        };
      }
      if (this.collection.hasMoreRecords) {
        moreRecordTitle = _.str.sformat(lang.TotalItemNotification, this.collection.totalCount, this.collection.totalFromServer);
      }
      return {
        hasMoreRecords: this.collection.hasMoreRecords,
        moreRecordTitle: moreRecordTitle,
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
      if (this.collection instanceof SearchResultCollection) {
        this.totalCount = 0;
        if (collection && collection.length > 0) {
          this.totalCount = collection.totalCount;
        }
        var listElem = this.$el.find(".searchHeaderCount"), changeTitle = this.$el.find(".searchResultsTitle"), txt = lang.searchFoundZero, addSearchTitle = lang.searchResults;
        if (this.totalCount !== null && this._isShown) {
          txt = _.str.sformat(lang.searchFoundAbout, this.totalCount);
        } else {
          addSearchTitle = null;
          txt = null;
        }
        listElem.empty();
        listElem.append(txt);
        changeTitle.empty();
        changeTitle.append(addSearchTitle);
        this.$el.find(".searchResultsTitle").prop("title", addSearchTitle);
      }
      return true;
    }
  });
  return SearchResultHeaderView;
});