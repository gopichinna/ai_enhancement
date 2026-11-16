/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "nuc/models/mixins/node.resource/node.resource.mixin", "d2/utils/constants", "d2/models/savedsearch/savedsearch.columns", "d2/models/savedsearch/savedsearch.model", "d2/server.adaptors/converters/servercolumns", "d2/server.adaptors/models/d2.fetchable.mixin", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/utils/sort.utils", "d2/utils/widget.constants", "i18n!d2/widgets/savedsearchestable/impl/nls/lang" ], function($, _, Backbone, Url, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, DelayedCommandableV2Mixin, NodeResourceMixin, constants, SavedSearchColumnCollection, SavedSearchModel, serverColumnsConverter, D2FetchableMixin, RestResources, RestLinkrels, sortUtils, widgetConstants, lang) {
  "use strict";
  var SavedSearchCollection = Backbone.Collection.extend({
    model: SavedSearchModel,
    constructor: function SavedSearchCollection(models, options) {
      options = options || {};
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.SAVED_SEARCH,
        widgetType: widgetConstants.D2.SEARCH
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      SavedSearchCollection.__super__.constructor.apply(this, arguments);
      this.clientColumns = this._getClientColumns();
      this.columns = new SavedSearchColumnCollection(this.clientColumns);
      this.columnTypes = {};
      this.node = options.node;
      options.orderBy = options.orderBy || "name asc";
      if (!this.node) {
        this.node = new SavedSearchModel();
      }
      this.makeNodeResource(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeD2Fetchable(options);
    },
    url: function() {
      var groupId = this.node.get("id"), qParams = {
        inline: true
      }, currRepo = RestResources.getCurrentRepository(), url = RestLinkrels.getLink(currRepo.get("links"), RestLinkrels.D2_SAVED_SEARCH);
      if (!groupId) {
        qParams["search-category"] = this.node.get("search-category");
        qParams["descend"] = this.node.includeNestedItems === true;
      } else {
        qParams["saved-searches-subcategory-id"] = groupId;
      }
      return Url.appendQuery(url, Url.combineQueryString(qParams));
    },
    parse: function(response) {
      var entries = response.entries;
      this.updateTableColumns(this.node.isAvailablePublic());
      return _.map(entries || [], function(item) {
        item.content.id = item.id;
        return item.content;
      });
    },
    updateTableColumns: function(isPublicCategory) {
      this.columns.reset(this._getClientColumns(isPublicCategory), {
        parse: true
      });
    },
    _getClientColumns: function(isPublicCategory) {
      var columns = [ {
        column_key: "type",
        default_action: true,
        definitions_order: 501,
        filter: false,
        key: "type",
        name: "type",
        sort: false
      }, {
        column_key: "name",
        d2_sort_key: "name",
        definitions_order: 511,
        default_action: true,
        direction: "Asc",
        filter: true,
        key: "name",
        name: lang.savedSearchTableColumnName,
        repeating: false,
        sort: true,
        title: lang.savedSearchTableColumnName,
        type: -1,
        type_name: "String",
        isNaming: true
      }, {
        column_key: "item_type",
        d2_sort_key: "item_type",
        filter: true,
        default_action: true,
        definitions_order: 531,
        direction: "",
        key: "item_type",
        name: lang.savedSearchTableColumnItemType,
        repeating: false,
        sort: true,
        title: lang.savedSearchTableColumnItemType,
        type: -1,
        type_name: "String"
      }, {
        column_key: "modify_date",
        d2_sort_key: "modify_date",
        default_action: true,
        definitions_order: 521,
        direction: "",
        key: "modify_date",
        name: lang.savedSearchTableColumnModifyDate,
        repeating: false,
        sort: true,
        title: lang.savedSearchTableColumnModifyDate,
        type: -7,
        type_name: "Date"
      } ];
      if (isPublicCategory) {
        columns.push({
          column_key: "modify_user_id",
          d2_sort_key: "modify_user_id",
          filter: true,
          default_action: true,
          definitions_order: 541,
          direction: "",
          key: "modify_user_id",
          name: lang.savedSearchTableColumnModifiedBy,
          repeating: false,
          sort: true,
          title: lang.savedSearchTableColumnModifiedBy,
          type: -1,
          type_name: "String"
        });
      }
      return columns;
    }
  });
  NodeResourceMixin.mixin(SavedSearchCollection.prototype);
  ClientSideBrowsableMixin.mixin(SavedSearchCollection.prototype);
  BrowsableV2ResponseMixin.mixin(SavedSearchCollection.prototype);
  DelayedCommandableV2Mixin.mixin(SavedSearchCollection.prototype);
  D2FetchableMixin.mixin(SavedSearchCollection.prototype);
  SavedSearchCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    if (RestResources.getCurrentUser().get("preferences").order_folder_before !== false) {
      var specialNodeWeight = function(item) {
        return item.isCategoryNode() ? 0 : 1;
      }, cmpVal = specialNodeWeight(left) - specialNodeWeight(right);
      if (cmpVal !== 0) {
        if (_.isString(this.orderBy) && this.orderBy.toLowerCase().trim().split(" ")[1] === "desc") {
          cmpVal = -1 * cmpVal;
        }
        return cmpVal;
      }
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, false);
  };
  return SavedSearchCollection;
});