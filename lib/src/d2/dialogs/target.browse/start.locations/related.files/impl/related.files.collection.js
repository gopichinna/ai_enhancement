/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "d2/widgets/metadata/panels/relations/metadata.relations.model", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "i18n!d2/dialogs/target.browse/start.locations/impl/nls/lang" ], function($, _, Backbone, MetadataRelationCollection, RestLinkrels, serverQueryUtils, lang) {
  "use strict";
  var RelatedFilesCollection = MetadataRelationCollection.extend({
    constructor: function(models, options) {
      this.options = options;
      MetadataRelationCollection.prototype.constructor.apply(this, arguments);
    },
    url: function() {
      var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_RELATIONS), subTypeFilters = this.options.subTypeFilters;
      var params = {
        scope: this,
        sort: this.sort,
        orderBy: this.orderBy,
        subTypeFilters: subTypeFilters
      };
      return serverQueryUtils.appendQueryParams(url, params);
    },
    sync: function(method, collection, options) {
      if (method === "read" && !this.clientColumns) {
        this.setColumnPreferences();
      }
      return MetadataRelationCollection.prototype.sync.call(this, method, collection, options);
    },
    setColumnPreferences: function() {
      var response = {};
      response.columns = [];
      response.columns.push({
        column_key: "type",
        default_action: true,
        definitions_order: 501,
        filter: false,
        key: "type",
        name: "type",
        sort: false
      });
      response.columns.push({
        column_key: "name",
        d2_sort_key: "name",
        definitions_order: 511,
        direction: "",
        filter: true,
        key: "name",
        name: lang.relatedFilesColumnName,
        repeating: false,
        sort: true,
        title: lang.relatedFilesColumnName,
        type: -1,
        type_name: "String"
      });
      response.columns.push({
        column_key: "relation_name",
        d2_sort_key: "relation_name",
        default_action: true,
        definitions_order: 521,
        direction: "Desc",
        isNaming: true,
        filter: true,
        key: "relation_name",
        name: lang.relatedFilesColumnRelationName,
        repeating: false,
        sort: true,
        title: lang.relatedFilesColumnRelationName,
        type: -1,
        type_name: "String"
      });
      response.columns.push({
        column_key: "title",
        d2_sort_key: "title",
        default_action: true,
        definitions_order: 531,
        direction: "Desc",
        isNaming: true,
        filter: true,
        key: "title",
        name: lang.relatedFilesColumnTitle,
        repeating: false,
        sort: true,
        title: lang.relatedFilesColumnTitle,
        type: -1,
        type_name: "String"
      });
      response.columns.push({
        column_key: "status",
        d2_sort_key: "status",
        default_action: true,
        definitions_order: 541,
        direction: "Desc",
        isNaming: true,
        filter: false,
        key: "status",
        name: lang.relatedFilesColumnStatus,
        repeating: false,
        sort: true,
        title: lang.relatedFilesColumnStatus,
        type: -1,
        type_name: "String"
      });
      response.columns.push({
        column_key: "modify_date",
        d2_sort_key: "modify_date",
        default_action: true,
        definitions_order: 551,
        direction: "Desc",
        isNaming: true,
        key: "modify_date",
        name: lang.relatedFilesColumnModifyDate,
        repeating: false,
        sort: true,
        title: lang.relatedFilesColumnModifyDate,
        type: -7,
        type_name: "Date"
      });
      response.columns.push({
        column_key: "modify_user_id",
        d2_sort_key: "modify_user_id",
        default_action: true,
        definitions_order: 561,
        direction: "Desc",
        isNaming: true,
        key: "modify_user_id",
        name: lang.relatedFilesColumnModifiedBy,
        repeating: false,
        sort: true,
        title: lang.relatedFilesColumnModifiedBy,
        type: -1,
        type_name: "String"
      });
      this.clientColumns = response.columns;
      this.columns.reset(this.clientColumns);
    },
    _prepareModel: function(attrs, options) {
      options || (options = {});
      var relationObjectId = attrs["associate_id"];
      attrs["file_object_id"] = attrs["id"];
      attrs["id"] = relationObjectId;
      return MetadataRelationCollection.prototype._prepareModel.call(this, attrs, options);
    }
  });
  return RelatedFilesCollection;
});