/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/underscore", "csui/widgets/search.results/search.results.view", "csui/utils/contexts/factories/connector", "csui/utils/contexts/page/page.context", "csui/utils/commands", "nuc/utils/url", "csui/utils/contexts/factories/search.query.factory", "d2/widgets/advanced.search.results/advanced.search.model", "d2/widgets/advanced.search.results/advanced.search.metadata.model", "d2/controls/query.form/query.form.model", "d2/controls/query.form/query.form.view", "d2/models/savedsearch/savedsearch.model", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/search.utils", "dctmw/utils/utils", "i18n!d2/widgets/advanced.search.results/nls/lang" ], function($, Backbone, _, SearchResultsView, ConnectorFactory, PageContext, commands, Url, SearchQueryModelFactory, AdvancedSearchCollection, AdvancedSearchMetdataModel, QueryFormModel, QueryFormView, SavedSearchModel, RestLinkrels, RestResources, searchUtils, utils, lang) {
  var AdvancedSearchView = SearchResultsView.extend({
    constructor: function(attributes, options) {
      var me = this, searchResults = {};
      var queryModel = attributes.context.getModel(SearchQueryModelFactory);
      var connector = attributes.context.getModel(ConnectorFactory);
      searchResults = new AdvancedSearchCollection(searchResults.models, _.extend({
        connector: connector,
        query: queryModel,
        commands: commands.getAllSignatures()
      }, searchResults.options, {
        autofetch: true,
        autoreset: true
      }));
      var searchMetadataObj = new AdvancedSearchMetdataModel({}, _.extend({}, options)), savedSearchId = queryModel.get("by-id"), queryFormId = queryModel.get("queryform");
      if (savedSearchId) {
        searchMetadataObj.advSearchId = savedSearchId;
        if (savedSearchId === "lastSearch") {
          searchMetadataObj.isLastSearch = true;
        } else {
          searchMetadataObj.isSavedSearch = true;
          searchResults.fromLandingPage = true;
        }
      } else if (queryFormId) {
        searchMetadataObj.advSearchId = queryFormId;
        searchMetadataObj.isQueryFormSearch = true;
        searchResults.fromLandingPage = true;
      }
      this.listenTo(searchMetadataObj, "sync", function() {
        document.title = _.str.sformat(lang.searchTitle, searchMetadataObj.searchResultsCollection.response.saved_search_name);
      });
      this.options = {};
      this.options.context = attributes.context;
      this.options.collection = searchResults;
      this.options.metadata = searchMetadataObj;
      this.options.collection.showTabularSearchView = true;
      this.options.enableBackButton = true;
      this.options.backButtonToolTip = lang.backButtonTooltip;
      this.searchResultsCollection = searchResults;
      this.searchResultsCollection.searchMetadataObj = searchMetadataObj;
      this.searchMetadataObj = searchMetadataObj;
      searchMetadataObj.searchResultsCollection = searchResults;
      if (searchMetadataObj.isQueryFormSearch) {
        var currRepo = RestResources.getCurrentRepository();
        var url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_SAVED_SEARCH);
        var queryformPropertiesUrl = Url.combine(url, "query-forms", searchMetadataObj.advSearchId, "dialog");
        var link = {
          rel: RestLinkrels.D2_QUERYFORM_DIALOG,
          href: queryformPropertiesUrl
        };
        var queryFormModel = new QueryFormModel({
          connector: connector,
          links: [ link ]
        });
        this.queryFormModel = queryFormModel;
        this.queryFormModel.fetch();
        searchMetadataObj.queryformdata = this.options.context.queryformdata && this.options.context.queryformdata[queryFormId] ? this.options.context.queryformdata[queryFormId] : {};
        if (this.options?.context?.queryform?.q_parent_id) {
          searchMetadataObj.parent_id = this.options.context.queryform.q_parent_id;
        }
      }
      SearchResultsView.call(this, this.options);
      this.getDataForSearchMetadata(searchMetadataObj).done(function() {
        searchMetadataObj.fetch().fail(function(error) {
          me._handleError(me.getModelForErrorHandling(searchMetadataObj), error);
        });
      });
      this.listenTo(this.options.context, "d2:objects:deleted", function() {
        searchMetadataObj.fetch().fail(function(error) {
          me._handleError(me.getModelForErrorHandling(searchMetadataObj), error);
        });
      });
    },
    getModelForErrorHandling: function(searchMetadataObj) {
      if (searchMetadataObj?.isSavedSearch === true) {
        return this.savedSearchModel;
      } else if (searchMetadataObj?.isQueryFormSearch === true) {
        return this.queryFormModel;
      }
    },
    getDataForSearchMetadata: function(searchMetadataObj) {
      var me = this, dfd = $.Deferred();
      if (searchMetadataObj && searchMetadataObj.isSavedSearch === true) {
        var savedSearchModel = new SavedSearchModel({
          id: searchMetadataObj.advSearchId
        }, {
          context: this.options.context,
          connector: this.options.context.getObject(ConnectorFactory)
        });
        this.blockActions();
        savedSearchModel.fetch().done(function() {
          me.savedSearchModel = savedSearchModel;
          searchMetadataObj.savedSearchModel = savedSearchModel;
          searchUtils.getSearchConfiguration({
            connector: me.options.connector
          }).done(function(searchConfig) {
            me.searchConfig = searchConfig;
            dfd.resolve();
          }).fail(function(error) {
            me._handleError(savedSearchModel, error);
            dfd.reject();
          });
        }).fail(function(error) {
          me._handleError(savedSearchModel, error);
          dfd.reject();
        }).always(function() {
          me.unblockActions();
        });
      } else {
        dfd.resolve(true);
      }
      return dfd.promise();
    },
    _handleError: function(model, error) {
      this.options.context.rejectPerspective(model, new Error(utils.parseAjaxErrorAsString(error)));
    }
  });
  return AdvancedSearchView;
});