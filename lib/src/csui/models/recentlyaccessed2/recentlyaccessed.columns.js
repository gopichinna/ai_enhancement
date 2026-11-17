/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/models/mixins/connectable/connectable.mixin", "csui/models/mixins/fetchable/fetchable.mixin", "csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin", "csui/models/mixins/v2.fields/v2.fields.mixin", "csui/models/mixins/v2.expandable/v2.expandable.mixin", "csui/models/mixins/v2.commandable/v2.commandable.mixin", "csui/models/mixins/state.requestor/state.requestor.mixin", "csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "csui/models/browsable/client-side.mixin", "csui/models/browsable/v2.response.mixin", "csui/models/nodechildrencolumn", "csui/models/nodechildrencolumns", "csui/models/node/node.model", "i18n!csui/models/widget/nls/lang", "csui/models/widget/recentlyaccessed/server.adaptor.mixin", "csui/utils/deepClone/deepClone" ], function(_, Backbone, ConnectableMixin, FetchableMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin, ExpandableV2Mixin, StateRequestorMixin, CommandableV2Mixin, DelayedCommandableV2Mixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, NodeChildrenColumnModel, NodeChildrenColumnCollection, NodeModel, lang, ServerAdaptorMixin) {
  "use strict";
  var RecentlyAccessedColumnModel = NodeChildrenColumnModel.extend({
    constructor: function RecentlyAccessedColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = "ra_" + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }
  });
  var RecentlyAccessedColumnCollection = NodeChildrenColumnCollection.extend({
    model: RecentlyAccessedColumnModel,
    constructor: function RecentlyAccessedColumnCollection(models, options) {
      if (!models) {
        models = [ {
          key: "type",
          type: 2,
          sort: true,
          default_action: true,
          name: "Type"
        }, {
          key: "name",
          type: -1,
          sort: true,
          default_action: true,
          contextual_menu: false,
          editable: true,
          filter_key: "name",
          name: "Name"
        }, {
          key: "reserved",
          type: 5,
          name: "Reserved"
        }, {
          key: "parent_id",
          type: 15,
          sort: false,
          name: "Parent ID"
        }, {
          key: "access_date_last",
          type: -7,
          sort: true,
          name: "Last Accessed"
        }, {
          key: "size",
          type: 2,
          sort: true,
          name: "Size"
        }, {
          key: "modify_date",
          type: -7,
          sort: true,
          initialSortingDescending: true,
          name: "Modified"
        }, {
          key: "favorite",
          type: 5,
          name: "Favorite"
        } ];
        models.forEach(function(column, index) {
          column.definitions_order = index + 100;
          column.column_key = column.key;
        });
      }
      NodeChildrenColumnCollection.prototype.constructor.call(this, models, options);
    },
    getColumnModels: function(columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(this, columnKeys, definitions);
      _.each(columns, function(column) {
        var columnKey = column["column_key"];
        if (columnKey === "type" || columnKey === "name" || columnKey === "access_date_last" || columnKey === "modify_date" || columnKey === "parent_id" || columnKey === "size") {
          column.sort = true;
          if (columnKey === "parent_id") {
            column.sort_key = "parent_name";
          }
        }
      });
      return columns;
    },
    getV2Columns: function(response) {
      var definitions = response.results && response.results[0] && response.results[0].metadata && response.results[0].metadata.properties || {};
      if (!definitions.access_date_last && definitions.modify_date) {
        definitions.access_date_last = _.clone(definitions.modify_date);
        definitions.access_date_last.key = "access_date_last";
        definitions.access_date_last.name = "Last Accessed";
      }
      if (!definitions.parent_name && definitions.name) {
        definitions.parent_name = _.clone(definitions.name);
        definitions.parent_name.key = "parent_name";
        definitions.parent_name.name = "Location Name";
      }
      return NodeChildrenColumnCollection.prototype.getV2Columns.call(this, response);
    }
  });
  return RecentlyAccessedColumnCollection;
});