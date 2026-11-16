/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "csui/utils/contexts/factories/connector", "d2/controls/globalmessage/globalmessage", "i18n!d2/commands/nls/localized.strings", "d2/utils/search.utils" ], function(require, _, $, CommandModel, CommandHelper, ConnectorFactory, GlobalMessage, lang, SearchUtils) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-RunSavedSearch",
      command_key: "D2-RunSavedSearch",
      name: lang.CommandNameRunSearchObject,
      scope: "single"
    },
    execute: function(status, options) {
      var node = CommandHelper.getJustOneNode(status);
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      var context = status.context || options.context;
      var savedSearchId = node.get("id"), obj_type = node.get("r_object_type");
      var self = this;
      var deferred = $.Deferred();
      if (obj_type === "d2_queryform_config") {
        self._openQueryFormDialog(context, savedSearchId, node);
        deferred.resolve();
      } else {
        this._checkSearchConfig(context).done(function(searchConfig) {
          switch (obj_type) {
           case "d2c_query":
            self._executeSavedSearch(context, savedSearchId, searchConfig);
            break;

           case "d2c_query_wizard":
            self._openSavedSearchDialog(context, savedSearchId, searchConfig);
            break;
          }
          deferred.resolve();
        }).fail(function() {
          GlobalMessage.showMessage("error", lang.noSearchConfiguration);
          deferred.reject();
        });
      }
      return deferred.promise();
    },
    _openSavedSearchDialog: function(context, savedSearchId, searchConfig) {
      var me = this;
      require([ "csui/utils/commands" ], function(commands) {
        me._getSavedSearchModel(context, savedSearchId, searchConfig).done(function(savedSearchModel) {
          var executeAdvancedSearchCommand = commands.get("D2-AdvancedSearch");
          executeAdvancedSearchCommand.execute({
            context: context
          }, {
            context: context,
            connector: context.getObject(ConnectorFactory),
            savedSearchModel: savedSearchModel
          });
        }).fail(function(error) {
          if (_.isString(error)) {
            GlobalMessage.showMessage("error", error);
          } else if (error && error.message) {
            GlobalMessage.showMessage("error", error.message, error.errorDetails);
          }
        });
      });
    },
    _executeSavedSearch: function(context, savedSearchId, searchConfig) {
      var me = this;
      require([ "csui/utils/commands" ], function(commands) {
        me._getSavedSearchModel(context, savedSearchId, searchConfig).done(function() {
          var executeSavedSearchCommand = commands.get("D2-ExecuteSavedSearch");
          executeSavedSearchCommand.execute({
            savedSearchId: savedSearchId,
            context: context
          });
        }).fail(function(error) {
          if (_.isString(error)) {
            GlobalMessage.showMessage("error", error);
          } else if (error && error.message) {
            GlobalMessage.showMessage("error", error.message, error.errorDetails);
          }
        });
      });
    },
    _openQueryFormDialog: function(context, savedSearchId, model) {
      delete context.queryform;
      require([ "csui/utils/contexts/factories/connector", "d2/controls/query.form/query.form.dialog" ], function(ConnectorFactory, QueryFormDialog) {
        var options = {
          savedSearchName: model.get("label"),
          savedSearchId: savedSearchId,
          context: context,
          connector: context.getObject(ConnectorFactory),
          links: model.get("links")
        };
        options.context.queryform = {
          q_parent_id: model.get("parent_id")
        };
        var qdialog = new QueryFormDialog(options);
        qdialog.show();
      });
    },
    _checkSearchConfig: function(context) {
      var deferred = $.Deferred();
      SearchUtils.getSearchConfiguration({
        connector: context.getObject(ConnectorFactory)
      }).done(function(searchConfig) {
        if (searchConfig !== null) {
          deferred.resolve(searchConfig);
        } else {
          deferred.reject();
        }
      }).fail(function() {
        deferred.reject();
      });
      return deferred.promise();
    },
    _getSavedSearchModel: function(context, savedSearchId, searchConfig) {
      var deferred = $.Deferred();
      if (savedSearchId === "lastSearch") {
        return $.Deferred().resolve().promise();
      }
      require([ "d2/models/savedsearch/savedsearch.model" ], function(SavedSearchModel) {
        var savedSearchModel = new SavedSearchModel({
          id: savedSearchId
        }, {
          context: context,
          connector: context.getObject(ConnectorFactory)
        });
        savedSearchModel.fetch().done(function() {
          var configuredTypes = searchConfig && searchConfig.types && _.keys(searchConfig.types), savedSearchData = savedSearchModel.get("search-object-form-data"), selectedTypes = savedSearchData && savedSearchData["search_types"];
          if (configuredTypes && configuredTypes.length > 0 && selectedTypes && selectedTypes.length > 0) {
            var commonTypes = _.intersection(configuredTypes, selectedTypes);
            if (commonTypes.length === 0) {
              deferred.reject(lang.searchConfigurationConflict);
              return;
            }
          }
          deferred.resolve(savedSearchModel);
        }).fail(deferred.reject);
      });
      return deferred.promise();
    }
  });
});