/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/commands", "dctmw/controls/behaviors/defer.dataload.until.visible.behavior", "d2/utils/search.utils", "d2/utils/contexts/factories/search.query.factory", "d2/widgets/savedsearch/savedsearch.groups.factory", "d2/widgets/shortcut/shortcut.behavior", "i18n!d2/widgets/shortcuts/impl/nls/lang" ], function(_, $, commands, DeferredDataLoadBehavior, SearchUtils, SearchQueryModelFactory, SavedSearchGroupFactory, ShortcutBehavior, lang) {
  "use strict";
  var QueryShortcutBehavior = ShortcutBehavior.extend({
    constructor: function QueryShortcutBehavior(options) {
      this.behaviors = _.extend(this.behaviors || {}, {
        DeferredDataLoadBehavior: {
          behaviorClass: DeferredDataLoadBehavior,
          containerSelector: ".module-d2-view",
          dataSource: function() {
            return this.savedSearchGroupModel;
          }.bind(this)
        }
      });
      QueryShortcutBehavior.__super__.constructor.apply(this, arguments);
      options = options || {};
      this.model = options.context.getModel(SearchQueryModelFactory, {
        attributes: {
          shortcutName: options.data.name
        }
      });
      this.model.isFetchable = function() {
        return false;
      };
      this.savedSearchGroupModel = options.context.getModel(SavedSearchGroupFactory, {
        detached: true,
        permanent: true
      });
      this.listenTo(this.savedSearchGroupModel, "sync error", this.view.render.bind(this.view));
    },
    onRender: function() {
      this.viewModel.set("enabled", false);
      if (this.savedSearchGroupModel.fetched) {
        this._updatSearchQueryId(this.savedSearchGroupModel.toJSON(), this.options);
      }
    },
    _checkSearchConfig: function() {
      var deferred = $.Deferred();
      SearchUtils.getSearchConfiguration({
        connector: this.savedSearchGroupModel.connector
      }).done(function(searchConfig) {
        if (searchConfig !== null) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }).fail(function() {
        deferred.reject();
      });
      return deferred.promise();
    },
    _updatSearchQueryId: function(savedSearchGroupModel, options) {
      var savedSearchModel = this._getSavedSearchModel(savedSearchGroupModel, options, "public_search");
      var queryId = "";
      if (savedSearchModel) {
        queryId = savedSearchModel.get("r_object_id");
        this.model.set("r_object_type", savedSearchModel.get("r_object_type"));
        this.model.set("r_object_id", savedSearchModel.get("r_object_id"));
        this.viewModel.set("enabled", true);
        if (savedSearchModel.get("r_object_type") === "d2c_query_wizard") {
          this.view.$el.find(".tile-icon .icon.icon-saved-search").addClass("icon-saved-search-form");
        }
      } else {
        var title = lang.shortcutQueryIdNotAvailable;
        if (this.model.get("shortcutName")) {
          title = _.str.sformat(lang.shortcutQueryIdNotAvailableWithName, this.model.get("shortcutName"));
        }
        this.viewModel.set("error", {
          message: lang.itemCannotbeAccessed,
          title: title
        });
      }
      this.model.set("id", queryId);
    },
    _getSavedSearchModel: function(savedSearchGroupModel, options, savedSearchType) {
      var savedSearchList = [];
      if (savedSearchGroupModel) {
        _.each(savedSearchGroupModel, function(savedSearchGroup) {
          if (savedSearchGroup.savedsearch) {
            _.each(savedSearchGroup.savedsearch, function(savedSearchModel) {
              savedSearchModel.get("r_object_id");
              savedSearchList.push(savedSearchModel);
            });
          }
        });
      }
      return _.find(savedSearchList, function(item) {
        return [ "d2c_query", "d2c_query_wizard" ].indexOf(item.get("r_object_type")) !== -1 && item.get("search-category") === savedSearchType && item.get("object_name") === options.data.name;
      });
    },
    onClick: function() {
      var searchQueryId = this.model.get("id");
      if (searchQueryId) {
        var runSavedSearchCommand = commands.get("D2-RunSavedSearch");
        runSavedSearchCommand.execute({
          nodes: [ this.model ],
          context: this.options.context
        });
      }
    }
  });
  return QueryShortcutBehavior;
});