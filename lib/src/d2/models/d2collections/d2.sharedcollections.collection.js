/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "d2/sdk/models/mixins/collection.resource.mixin", "d2/models/d2collections/d2.mycollections.model", "d2/models/d2collections/table/d2collections.column.collection", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "i18n!d2/widgets/d2collections.perspective/d2collections.list/impl/nls/lang" ], function($, _, Backbone, Url, CollectionResourceMixin, MyCollectionWidgetModel, CollectionWidgetColumnCollection, constants, widgetConstants, RestLinkrels, RestResources, lang) {
  "use strict";
  var SharedCollectionWidgetCollection = Backbone.Collection.extend({
    model: MyCollectionWidgetModel,
    idAttribute: "id",
    constructor: function SharedCollectionWidgetCollection(models, options) {
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
      SharedCollectionWidgetCollection.__super__.constructor.call(this, models, options);
      this.makeCollectionResource(options);
    },
    url: function() {
      return Url.appendQuery(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_COLLECTIONS_SHARED), Url.combineQueryString({
        page: -1
      }));
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
        column_key: "owner_name",
        d2_sort_key: "owner_name",
        definitions_order: 511,
        default_action: false,
        direction: "Asc",
        filter: true,
        key: "owner_name",
        name: lang.CollectionsColumnSharedBy,
        repeating: false,
        sort: true,
        title: lang.CollectionsColumnSharedBy,
        type: -1,
        type_name: "String"
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
    parse: function(response) {
      return (response.entries || []).map(function(entry) {
        var obj = entry.content;
        _.extend(obj.properties, {
          name: obj.properties.object_name,
          id: obj.properties.r_object_id,
          r_modify_date: obj.properties.r_modify_date,
          r_creation_date: obj.properties.r_creation_date,
          owner_name: obj.properties.owner_name,
          isSharedCollection: true,
          type: constants.Types.COLLECTIONS,
          links: entry.content.links
        });
        return obj.properties;
      });
    }
  });
  CollectionResourceMixin.mixin(SharedCollectionWidgetCollection.prototype);
  return SharedCollectionWidgetCollection;
});