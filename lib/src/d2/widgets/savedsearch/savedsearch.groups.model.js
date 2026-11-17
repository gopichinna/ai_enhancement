/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/utils/base", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "d2/widgets/savedsearch/savedsearch.model", "d2/utils/constants", "dctmw/utils/utils", "i18n!d2/widgets/savedsearch/impl/nls/lang" ], function($, _, Backbone, Url, base, ConnectableMixin, FetchableMixin, SavedSearchCollection, Constants, utils, lang) {
  "use strict";
  function _createMergedResponse(savedsearchCollection) {
    var groupsMap = {};
    var results = [];
    var ungroupedPublicSrch;
    savedsearchCollection.map(function(ss) {
      var tabid = ss.get("tab_id");
      const isPrivateCategoryRoot = tabid === lang.privatesearch;
      if (ss.get("search-category") === "public_search") {
        tabid = 0;
      }
      if (!groupsMap[tabid]) {
        var group = {};
        group["tab_id"] = tabid;
        group.name = tabid !== -1 ? tabid : ss.get("name");
        group.tooltip = isPrivateCategoryRoot ? lang.privatesearch : ss.get("grouptooltip");
        group.savedsearch = [];
        group.savedsearch.push(ss);
        results.push(group);
        groupsMap[tabid] = group.savedsearch;
        if (tabid === 0) {
          ungroupedPublicSrch = group;
        }
      } else {
        groupsMap[tabid].push(ss);
      }
    });
    var finalresults = results.filter(function(group) {
      return group["tab_id"] === -1 || group["tab_id"] === lang.privatesearch;
    });
    var folderResults = results.filter(function(group) {
      return group["tab_id"] !== 0 && group["tab_id"] !== -1;
    });
    folderResults = _.sortBy(folderResults, function(folder) {
      return folder.name.toLowerCase();
    });
    var finalResults = finalresults.concat(folderResults);
    if (ungroupedPublicSrch) {
      finalResults.push(ungroupedPublicSrch);
    }
    return finalResults;
  }
  var SavedSearchGroupModel = Backbone.Model.extend({
    idAttribute: "tab_id",
    constructor: function SavedSearchGroupModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      attributes || (attributes = {});
      this.savedsearch = new SavedSearchCollection(attributes.savedsearch, {
        connector: options.connector,
        autoreset: true,
        tab_id: this.get("tab_id")
      });
    }
  });
  var SavedSearchGroupsCollection = Backbone.Collection.extend({
    model: SavedSearchGroupModel,
    constructor: function SavedSearchGroupsCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      if (options) {
        this.options = _.pick(options, [ "connector", "autoreset", "includeResources", "fields", "expand" ]);
      }
      this.makeConnectable(options).makeFetchable(options);
      if (!this.savedsearch) {
        this.savedsearch = new SavedSearchCollection(undefined, {
          connector: this.connector,
          autoreset: true
        });
      }
    },
    clone: function() {
      var clone = new this.constructor(this.models, {
        connector: this.connector,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy,
        expand: _.clone(this.expand)
      });
      return clone;
    },
    getSortByOrderUrlQuery: function() {
      return {
        sort: "order"
      };
    },
    resetCollection: function(models, options) {
      this.reset(models, options);
      this.fetched = true;
    },
    sync: function(method, model, options) {
      if (method === "read") {
        var savedsearchCollection = this.savedsearch;
        var deferred = $.Deferred();
        options.parse = false;
        var me = this;
        this.trigger("request", model, {}, options);
        savedsearchCollection.fetch({
          reload: true
        }).then(function() {
          if (!utils.isMobile()) {
            var qrCodeModelsList = savedsearchCollection.filter(function(model) {
              var queryFormType = model.get(Constants.QueryFormTypes.QUERY_FORM_TYPE), qrCodeQueryFormType = Constants.QueryFormTypes.QR_CODE;
              return queryFormType && queryFormType.toLowerCase() === qrCodeQueryFormType;
            });
            if (qrCodeModelsList.length > 0) {
              savedsearchCollection.remove(qrCodeModelsList, {
                silent: true
              });
            }
          }
          var merged = _createMergedResponse(savedsearchCollection);
          options.success.call(options.context, merged, "success", {});
          deferred.resolve(merged);
        }, function(error) {
          me.trigger("error", model, {}, options);
          deferred.reject(error);
        });
        return deferred.promise();
      }
    }
  });
  ConnectableMixin.mixin(SavedSearchGroupsCollection.prototype);
  FetchableMixin.mixin(SavedSearchGroupsCollection.prototype);
  return SavedSearchGroupsCollection;
});