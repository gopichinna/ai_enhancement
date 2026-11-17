/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "d2/sdk/models/mixins/collection.resource.mixin", "d2/models/d2collections/d2.mycollections.model", "d2/models/d2collections/table/d2collections.column.collection", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "dctmw/utils/utils", "i18n!d2/widgets/d2collections.perspective/d2collections.list/impl/nls/lang" ], function($, _, Backbone, CollectionResourceMixin, MyCollectionWidgetModel, CollectionWidgetColumnCollection, constants, widgetConstants, RestLinkrels, RestResources, serverQueryUtils, dctmUtils, lang) {
  "use strict";
  var MyCollectionWidgetCollection = Backbone.Collection.extend({
    model: MyCollectionWidgetModel,
    widgetType: "CollectionWidget",
    idAttribute: "id",
    constructor: function MyCollectionWidgetCollection(models, options) {
      options = options || {};
      this.clientColumns = this._getClientColumns();
      this.columns = new CollectionWidgetColumnCollection(this.clientColumns);
      this.columnTypes = {};
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.COLLECTIONS,
        widgetType: widgetConstants.D2.COLLECTIONS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      this.options = options;
      MyCollectionWidgetCollection.__super__.constructor.call(this, models, options);
      this.makeCollectionResource(options);
    },
    url: function() {
      const url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_COLLECTIONS);
      return serverQueryUtils.appendQueryParams(url, {
        sort: !_.isEmpty(this.orderBy),
        filter: !_.isEmpty(this.serverFilterColumn),
        scope: this,
        clientColumns: this.clientColumns
      }) + "&include-total=true";
    },
    _getClientColumns: function() {
      var columns = [ {
        column_key: "name",
        d2_sort_key: "name",
        definitions_order: 511,
        default_action: true,
        direction: "Asc",
        filter: true,
        key: "name",
        name: lang.CollectionsColumnName,
        repeating: false,
        sort: true,
        title: lang.CollectionsColumnName,
        type: -1,
        type_name: "String",
        isNaming: true
      }, {
        column_key: "r_creation_date",
        d2_sort_key: "r_creation_date",
        default_action: false,
        definitions_order: 521,
        direction: "",
        key: "r_creation_date",
        name: lang.CollectionsColumnCreatedDate,
        repeating: false,
        sort: true,
        title: lang.CollectionsColumnCreatedDate,
        type: -7,
        type_name: "Date"
      }, {
        column_key: "r_modify_date",
        d2_sort_key: "r_modify_date",
        default_action: false,
        definitions_order: 531,
        direction: "",
        key: "r_modify_date",
        name: lang.CollectionsColumnModifiedDate,
        repeating: false,
        sort: true,
        title: lang.CollectionsColumnModifiedDate,
        type: -7,
        type_name: "Date"
      } ];
      return columns;
    },
    sync: function(method, model, options) {
      var me = this, dfd = $.Deferred(), oldSuccess = options.success, oldError = options.error;
      options.error = function() {
        oldError && oldError.apply(options.context, arguments);
        dfd.reject.apply(dfd, arguments);
      };
      options.success = function(model, status, xhr) {
        oldSuccess.call(options.context, model, status, xhr);
        dfd.resolve();
      };
      Backbone.Model.prototype.sync.call(me, method, model, options);
      return dfd.promise();
    },
    parse: function(response) {
      const me = this;
      me.hasMoreRecords = Boolean(response["has-more-records"]);
      me.totalFromServer = response["total"];
      return (response.entries || []).map(function(entry) {
        var obj = entry.content;
        _.extend(obj.properties, {
          name: obj.properties.object_name,
          id: obj.properties.r_object_id,
          r_modify_date: obj.properties.r_modify_date,
          r_creation_date: obj.properties.r_creation_date,
          isSharedCollection: obj.properties.is_shared,
          type: constants.Types.COLLECTIONS,
          links: entry.content.links
        });
        return obj.properties;
      });
    }
  });
  CollectionResourceMixin.mixin(MyCollectionWidgetCollection.prototype);
  const originalFetch = MyCollectionWidgetCollection.prototype.fetch;
  MyCollectionWidgetCollection.prototype.fetch = function(options) {
    options = options || {};
    const namedLocalStorage = dctmUtils.getSessionStore(constants.StorageKey.COLLECTIONS_NAVIGATIONS);
    if (namedLocalStorage.get(constants.StorageKey.COLLECTIONS_NAVIGATIONS)) {
      this.filters = namedLocalStorage.get(constants.StorageKey.COLLECTIONS_NAVIGATIONS);
      this.hasMoreRecords = true;
    }
    this.serverFilterEnabled = false;
    let filter, lastFilter;
    if (this.filters) {
      filter = _.omit(this.filters, function(value) {
        return _.isUndefined(value) || _.isEmpty(value);
      });
    }
    if (this._lastFilterAndSortCriteria && this._lastFilterAndSortCriteria.filters) {
      lastFilter = _.omit(this._lastFilterAndSortCriteria.filters, function(value) {
        return _.isUndefined(value) || _.isEmpty(value);
      });
    }
    let forceServerSideFilter = false;
    if (this.fetched === undefined && filter && _.keys(filter).length === 1) {
      forceServerSideFilter = true;
      this.initialServerSideFilter = true;
    }
    if (this.hasMoreRecords === true || forceServerSideFilter) {
      if (!_.isEqual(filter, lastFilter) || !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy)) {
        options.reload = true;
        this.serverFilterEnabled = true;
      }
      let filterArray = filter && _.keys(filter) || [];
      if (filterArray.length > 0) {
        this.serverFilterColumn = filterArray[0];
        this.serverFilterValue = filter[this.serverFilterColumn];
      } else {
        this.serverFilterColumn = this.serverFilterValue = undefined;
      }
      this.hadMoreRecords = true;
    } else if (this.hadMoreRecords === true && this.serverFilterColumn) {
      let filterValue = filter[this.serverFilterColumn];
      if (filterValue !== this.serverFilterValue) {
        options.reload = true;
        this.filters = _.omit(this.filters, function(value, key) {
          return key !== this.serverFilterColumn;
        }, this);
      }
      this.serverFilterValue = filterValue;
    }
    return originalFetch.call(this, options);
  };
  return MyCollectionWidgetCollection;
});