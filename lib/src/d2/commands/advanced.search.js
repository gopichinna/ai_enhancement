/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/globalmessage/globalmessage", "csui/utils/commandhelper", "csui/models/command", "csui/utils/contexts/factories/connector", "d2/utils/advanced.search.utils", "d2/utils/search.utils", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, GlobalMessage, CommandHelper, CommandModel, ConnectorFactory, AdvancedSearchUtils, searchUtils, utils, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-AdvancedSearch",
      command_key: "D2-AdvancedSearch",
      name: lang.AdvancedSearchCommandName,
      scope: "single"
    },
    _fetchSearchLocations: function(options) {
      var deferred = $.Deferred();
      AdvancedSearchUtils.getSearchLocations({
        connector: options.connector,
        searchConfig: options.searchConfig
      }).done(function(linearSearchLocations) {
        deferred.resolve(AdvancedSearchUtils.getSearchLocationsTreeStructure({
          linearSearchLocations: linearSearchLocations,
          searchConfig: options.searchConfig
        }));
      }).fail(function(xhr, message, statusText) {
        deferred.reject(xhr, message, statusText);
      });
      return deferred.promise();
    },
    _fetchSearchConfig: function(options) {
      var deferred = $.Deferred();
      searchUtils.getSearchConfiguration({
        connector: options.connector
      }).done(function(searchConfig) {
        if (searchConfig !== null) {
          deferred.resolve(searchConfig);
        } else {
          GlobalMessage.showMessage("error", lang.noSearchConfiguration);
          deferred.reject();
        }
      }).fail(deferred.reject);
      return deferred.promise();
    },
    execute: function(status, options) {
      options = options || {};
      var deferred = $.Deferred();
      this._executeAdvancedSearch(status, options).done(function(message) {
        message && GlobalMessage.showMessage("success", message);
        deferred.resolve();
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _executeAdvancedSearch: function(status, options) {
      var me = this;
      options.connector = status.context.getObject(ConnectorFactory);
      _.extend(options, status);
      me._blockActions();
      return me._fetchSearchConfig(options).then(function(searchConfig) {
        options.searchConfig = searchConfig;
        options.searchConfig.searchOptions = {
          searchTerm: options.searchTerm,
          searchOption: options.searchOption,
          currentNode: options.currentNode
        };
        me._unblockActions();
        return me._openWizard(options);
      }).catch(function(xhr, message, statusText) {
        me._unblockActions();
        if (xhr === "close" || !message && !statusText) {
          return $.Deferred().reject().promise();
        } else {
          GlobalMessage.showMessage("error", utils.parseAjaxErrorAsString(xhr, statusText, message));
          return $.Deferred().reject(xhr, message, statusText).promise();
        }
      });
    },
    _openWizard: function(options) {
      var deferred = $.Deferred();
      require([ "d2/dialogs/advanced.search/advanced.search.dialog" ], function(AdvancedSearchDialog) {
        var advancedSearchDialog = new AdvancedSearchDialog({
          searchConfig: options.searchConfig,
          context: options.context,
          connector: options.connector,
          savedSearchModel: options.savedSearchModel,
          search_in_storeContainer: true
        });
        advancedSearchDialog.showAdvancedSearchWizard().done(deferred.resolve).fail(deferred.reject);
      });
      return deferred.promise();
    },
    _blockActions: function(view) {
      CommandHelper.blockD2ViewActions(view);
    },
    _unblockActions: function(view) {
      CommandHelper.unblockD2ViewActions(view);
    }
  });
});