/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n", "nuc/lib/marionette", "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/contexts/factories/connector", "csui/controls/globalmessage/globalmessage", "csui/controls/form/pub.sub", "dctmw/utils/utils", "d2/controls/query.form/query.form.view", "d2/controls/query.form/impl/query.form.header.view", "d2/controls/saved.search/impl/saved.search.form.footer.view", "d2/dialogs/advanced.search/advanced.search.dialog.view", "i18n!d2/controls/saved.search/impl/nls/lang", "i18n!d2/widgets/advanced.search.results/nls/lang", "css!d2/controls/saved.search/impl/saved.search.form" ], function(i18n, Marionette, _, $, ConnectorFactory, GlobalMessage, PubSub, utils, QueryFormView, QueryFormHeaderView, SavedSearchFormFooterView, AdvancedSearchDialogView, lang, searchResultsLang) {
  "use strict";
  var SavedSearchAdvancedSearchDialogView = AdvancedSearchDialogView.extend({
    constructor: function SavedSearchAdvancedSearchDialogView() {
      AdvancedSearchDialogView.prototype.constructor.apply(this, arguments);
    },
    updateFooter: function() {
      this.options.queryFormView && this.options.queryFormView.trigger("update:footer");
    }
  });
  return QueryFormView.extend({
    constructor: function SavedSearchFormView() {
      QueryFormView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "query:form:reset", this._onReset);
      this.listenTo(this, "query:form:save", this._onSave);
      this.listenTo(this, "query:form:saveas", this._onSaveAs);
      this.listenTo(this, "update:footer", this.updateFooter);
      this.listenTo(this.options.searchResultsView.collection, "sync", this.onSearchCollectionSync);
      this.listenTo(PubSub, "d2:footer:manageScroll", this.handleScroll);
    },
    handleScroll: function(option) {
      if (option) {
        this.formview.$el.attr("style", "overflow-y: hidden !important");
      } else {
        this.formview.$el.removeAttr("style");
      }
    },
    createFormView: function() {
      var deferred = $.Deferred();
      this.options.savedSearchModel?.ensureFetched().done(() => {
        deferred.resolve(new SavedSearchAdvancedSearchDialogView({
          savedSearchModel: this.options.savedSearchModel,
          searchConfig: this.options.searchConfig,
          context: this.options.context,
          connector: this.options.connector,
          queryFormView: this,
          blockingView: this.options.searchResultsView,
          showMessageInPanel: false,
          search_in_restoreContainer: true,
          search_in_storeContainer: true
        }));
      });
      return deferred.promise();
    },
    getHeaderView: function() {
      return new QueryFormHeaderView(_.extend(this.options, {
        savedSearchName: lang.searchByLabel
      }));
    },
    getFooterView: function() {
      return new SavedSearchFormFooterView(this.options);
    },
    updateFooter: function() {
      var searchButtonEnabled = (this.searchPerformed || this.searchObjectSaved || this.formview.isValueUpdated([ "save" ])) && this.formview.isValid(), saveButtonEnabled = this.formview.validateSaveAction(), previouslySavedSearch = this.formview.getPreviouslySavedSearch(), applicableSavingButton = previouslySavedSearch && this.formview.isSearchNameUpdated() ? "saveas" : "save";
      this.footerview.enableOrDisableButton("search", searchButtonEnabled);
      this.footerview.enableOrDisableButton("save", saveButtonEnabled);
      this.footerview.changeSaveButtonState(applicableSavingButton);
    },
    onShow: function() {
      this.$el.closest(".d2-query-form-view").addClass("d2-saved-search-form-view");
      QueryFormView.prototype.onShow.apply(this, arguments);
    },
    _search: function() {
      this.searchPerformed = true;
      var me = this, searchResultsView = me.options.searchResultsView, searchMetadataObj = searchResultsView.collection.searchMetadataObj;
      searchResultsView.blockActions();
      me.formview.resolveSavedSearchId().done(function(savedSearchId) {
        searchMetadataObj.advSearchId = savedSearchId;
        if (searchMetadataObj.searchResultsCollection && searchMetadataObj.searchResultsCollection && searchMetadataObj.searchResultsCollection.searchFacets && searchMetadataObj.searchResultsCollection.searchFacets.filters) {
          searchMetadataObj.searchResultsCollection.searchFacets.filters = [];
        }
        searchMetadataObj.fetch({
          addnlOptions: {
            resetColumnPref: true,
            retainSavedSearchForm: true
          }
        }).done(function() {
          me.formview.invokeSavedSearchCommand(savedSearchId, true);
        }).fail(function(xhr) {
          GlobalMessage.showMessage("error", utils.parseAjaxErrorAsString(xhr));
        }).always(function() {
          searchResultsView.unblockActions();
        });
      });
    },
    _onReset: function() {
      var me = this, previouslySavedSearch = me.formview.getPreviouslySavedSearch(), searchMetadataObj = me.options.searchResultsView.collection.searchMetadataObj, savedSearchId = previouslySavedSearch && previouslySavedSearch.id || searchMetadataObj.advSearchId;
      me.formview.clearBanner();
      if (savedSearchId) {
        me.refreshSavedSearchObject(savedSearchId).done(function() {
          me.render();
        }).fail(function(errorMsg) {
          me.formview.showBanner("error", errorMsg);
        });
      }
    },
    _onSave: function() {
      this.formview.saveOrUpdateSavedSearch().done(this.refreshSavedSearchObject.bind(this));
      this.searchObjectSaved = true;
    },
    _onSaveAs: function() {
      this.formview.saveAdvancedSearch().done(this.refreshSavedSearchObject.bind(this));
      this.searchObjectSaved = true;
    },
    refreshSavedSearchObject: function(savedSearchId) {
      var me = this, dfd = $.Deferred();
      me.options.savedSearchModel.set("id", savedSearchId);
      me.options.searchResultsView.blockActions();
      me.options.savedSearchModel.fetch().done(function() {
        dfd.resolve();
      }).fail(function(error) {
        dfd.reject(utils.parseAjaxErrorAsString(error));
      }).always(function() {
        me.options.searchResultsView.unblockActions();
      });
      return dfd.promise();
    },
    onSearchCollectionSync: function() {
      var searchResultsView = this.options.searchResultsView, searchCollection = searchResultsView.collection, searchName = searchCollection.searching.title, previouslySavedSearch = this.formview && this.formview.getPreviouslySavedSearch();
      if (previouslySavedSearch && previouslySavedSearch.name && searchName === "lastSearch" && searchCollection.length > 0) {
        var resultTitle = _.str.sformat(searchResultsLang.searchResultsTitle, previouslySavedSearch.name);
        searchResultsView.$el.find(".csui-results-title").html(resultTitle);
        searchResultsView.$el.find(".headerCount").empty();
      }
      searchResultsView.resetFacetToggle();
    },
    getMinimumResizeWidth: function() {
      return 300;
    },
    getMaximumResizeWidth: function() {
      return 400;
    }
  });
});