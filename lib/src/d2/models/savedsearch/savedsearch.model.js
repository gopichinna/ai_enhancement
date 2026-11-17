/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "nuc/utils/url", "d2/utils/constants", "d2/utils/advanced.search.utils", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/search.utils", "dctmw/utils/utils", "d2/utils/widget.constants", "d2/server.adaptors/converters/savedsearch" ], function(_, $, Backbone, NodeModel, Url, constants, AdvancedSearchUtils, RestResources, RestLinkrels, serverQueryUtils, SearchUtils, utils, widgetConstants, SavedSearchConverter) {
  "use strict";
  var SavedSearchModel = NodeModel.extend({
    constructor: function SavedSearchModel(attributes, options) {
      options || (options = {});
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.SAVED_SEARCH,
        widgetType: widgetConstants.D2.SEARCH
      };
      NodeModel.prototype.constructor.call(this, attributes, options);
      this.widgetType = widgetConstants.D2.SEARCH;
    },
    parse: function(response, options) {
      this._clearPrevResidualAttrs(options);
      return SavedSearchConverter.convertSavedSearch(response);
    },
    url: function() {
      var id = this.get("id");
      if (!id) {
        throw new Error("id not found");
      }
      var repoLink = RestResources.getCurrentRepository().get("links"), linkRel = this.isCategoryNode() ? RestLinkrels.D2_SAVED_SEARCH_GROUPS : RestLinkrels.D2_SAVED_SEARCH;
      return Url.combine(RestLinkrels.getLink(repoLink, linkRel), id);
    },
    sync: function(method, model, options) {
      var me = this, dfd = $.Deferred(), oldSuccess = options.success, oldError = options.error;
      if (!this.isCategoryNode() && _.contains([ "create", "patch" ], method)) {
        throw new Error("unsupported operation");
      }
      options.success = function(model, status, xhr) {
        me._handleSuccess(method, model, options).done(function() {
          oldSuccess.call(options.context, model, status, xhr);
          dfd.resolve();
        }).fail(function(xhr, statusText, error) {
          oldError.call(options.context, xhr, statusText, error);
          dfd.reject.apply(dfd, arguments);
        });
      };
      options.error = function() {
        oldError && oldError.apply(options.context, arguments);
        dfd.reject.apply(dfd, arguments);
      };
      if (method === "create") {
        this.createSavedSearchCategory(options);
      } else if (method === "read") {
        Backbone.Model.prototype.sync.call(this, method, model, options);
      } else if (method === "patch") {
        options.success = function(response) {
          oldSuccess && oldSuccess.apply(options.context, arguments);
          me.trigger("d2:savedsearch:rename", me);
          dfd.resolve(response);
        };
        options.error = function(request, textStatus, error) {
          var err = utils.parseAjaxError(request, textStatus, error);
          oldError && oldError.apply(options.context, arguments);
          dfd.reject({
            responseJSON: {
              error: err.message
            }
          });
        };
        this.renameSearchCategory(options);
      } else if (method === "delete") {
        this.deleteSearcObject(options);
      }
      return dfd.promise();
    },
    _handleSuccess: function(method, model, options) {
      var dfd = $.Deferred();
      if (method === "read") {
        this.fetchData(model, options).done(dfd.resolve).fail(dfd.reject);
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    _setValidActions: function(model, id, output) {
      var dfd = $.Deferred(), actions = output.actions && output.actions[id] || [];
      if (this.connector && model.properties["r_object_type"] === "d2c_query_category" && model.properties["search-category"].toUpperCase() === constants.AdvancedSearch.CATEGORY_PUBLIC) {
        SearchUtils.getSearchConfiguration({
          connector: this.connector
        }).always(function(searchConfig) {
          if (!(searchConfig && searchConfig.canCreatePublicSearch)) {
            var renameIdx = _.findIndex(actions, {
              signature: "Rename"
            });
            renameIdx !== -1 && actions.splice(renameIdx, 1);
          }
          model.properties.actions = actions;
          dfd.resolve();
        });
      } else {
        model.properties.actions = actions;
        dfd.resolve();
      }
      return dfd.promise();
    },
    fetchData: function(model) {
      var dfd = $.Deferred(), id = model.properties.r_object_id, SEPARATOR_VALUE = "¬", foldertypeName = model.properties["search-category"] === constants.AdvancedSearch.CATEGORY_PUBLIC ? "node_saved_public_searches" : "node_saved_searches", params = {
        queryAction: "PROMOTED",
        actions: {
          menuType: constants.MenuTypes.SAVED_SEARCH,
          widgetType: widgetConstants.D2.SEARCH,
          contentPathId: foldertypeName + SEPARATOR_VALUE + id
        },
        ids: [ id ],
        connector: this.connector
      };
      serverQueryUtils.fetchDataForObjects(params).done(function(output) {
        this._setValidActions(model, id, output).always(dfd.resolve);
      }.bind(this)).fail(dfd.reject);
      return dfd.promise();
    },
    createSavedSearchCategory: function(options) {
      AdvancedSearchUtils.saveSavedSearchCategory({
        connector: this.connector,
        name: this.get("object_name"),
        category: this.get("search-category"),
        parentId: this.get("parent_id"),
        restrictedGroups: this.get("restricted_to_groups")
      }).done(function() {
        options.success.apply(options.context, arguments);
      }).fail(function() {
        options.error.apply(options.context, arguments);
      });
    },
    renameSearchCategory: function(options) {
      var me = this, data = {
        properties: {
          object_name: (options.data || options.attrs).name
        }
      };
      _.extend(options, {
        contentType: constants.MediaTypes.DCTM_JSON,
        type: "PATCH",
        url: me.url(),
        data: JSON.stringify(data)
      });
      $.ajax(this.connector.extendAjaxOptions(options));
    },
    deleteSearcObject: function(options) {
      var isCategoryNode = this.isCategoryNode(), url = isCategoryNode ? this.url() : RestLinkrels.getLink(this.get("links"), RestLinkrels.DELETE), queryParams = {};
      if (isCategoryNode && options.deleteOptions && options.deleteOptions.deleteSearchGroupAndDescendants) {
        queryParams["force_delete"] = true;
      }
      if (options?.container.has("parent_id")) {
        queryParams["parent-id"] = options.container.get("parent_id");
      }
      url = Url.appendQuery(url, Url.combineQueryString(queryParams));
      _.extend(options, {
        contentType: constants.MediaTypes.DCTM_JSON,
        type: "DELETE",
        url: url
      });
      $.ajax(this.connector.extendAjaxOptions(options));
    },
    isAvailablePublic: function() {
      return this.get("search-category") === constants.AdvancedSearch.CATEGORY_PUBLIC;
    },
    isCategoryNode: function() {
      return this.get("r_object_type") === "d2c_query_category";
    }
  });
  return SavedSearchModel;
});