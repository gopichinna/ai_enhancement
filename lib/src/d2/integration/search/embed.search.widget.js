/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/widgets/search.results/search.results.view", "d2/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/search.query.factory", "d2/utils/constants", "d2/integration/impl/embedder.utils", "i18n!d2/integration/search/impl/nls/lang" ], function($, _, Marionette, SearchResultsView, GlobalMessage, SearchQueryModelFactory, constants, embedderUtils, lang) {
  "use strict";
  var EmbedSearchWidget = function(options) {
    if (!options || !options.context) {
      throw new Error("context attribute is mandatory in the constructor options");
    }
    this.options = options;
    this.options.context.isEmbeddedSearch = true;
    this.options.context.isFolderBrowser = false;
  };
  _.extend(EmbedSearchWidget.prototype, {
    execute: function(params) {
      var me = this, deferred = $.Deferred(), queryParams = embedderUtils.getQueryParams();
      if (queryParams && queryParams["plugin_mode"] && queryParams["plugin_mode"] === constants.BrowserPluginMode.WSCTF) {
        embedderUtils.checkWsctfStatus(me.options.context).done(function() {
          me.executeEmbedSearch(params).done(deferred.resolve).fail(deferred.reject);
        }).fail(deferred.reject);
      } else {
        me.executeEmbedSearch(params).done(deferred.resolve).fail(deferred.reject);
      }
      return deferred.promise();
    },
    executeEmbedSearch: function(params) {
      var region, searchQuery, attrs, deferred = $.Deferred();
      if (!params.query) {
        return deferred.reject(lang.MissingQueryParam);
      }
      attrs = {
        where: params.query
      };
      if (params.folder_id) {
        attrs["current-folder-id"] = params.folder_id;
        attrs["descend"] = params.descend;
      }
      searchQuery = this.options.context.getModel(SearchQueryModelFactory);
      searchQuery.clear({
        silent: true
      });
      searchQuery.set(attrs);
      region = new Marionette.Region({
        el: this.options.el || $(".d2-embed-container")
      });
      this.view = this._createView(this.options);
      GlobalMessage.setMessageRegionView(this.view);
      this.view.on("go:back", function() {
        window.history.go(-1);
      });
      $(".d2-embed > .load-container").remove();
      region.show(this.view);
      this.options.context.fetch().done(deferred.resolve).fail(deferred.reject);
      this.options.context.visitedNodeHistory && this.options.context.visitedNodeHistory.push("search");
      return deferred.promise();
    },
    destroy: function() {
      if (this.view) {
        this.view.destroy();
      }
    },
    _createView: function(options) {
      return new SearchResultsView(_.extend({}, options, {
        enableBackButton: true,
        attachBackButtonListener: false
      }));
    }
  });
  return EmbedSearchWidget;
});