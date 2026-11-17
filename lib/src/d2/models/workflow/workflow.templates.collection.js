/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/node/node.model", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/server.adaptors/converters/servercolumns", "nuc/models/columns", "d2/utils/server.query.utils", "d2/utils/sort.utils", "i18n!d2/dialogs/target.browse/start.locations/impl/nls/lang" ], function($, _, Backbone, Url, ConnectableMixin, FetchableMixin, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, NodeModel, RestResources, RestLinkrels, serverColumnsConverter, ColumnCollection, serverQueryUtils, sortUtils, lang) {
  "use strict";
  var WorkflowTemplates = Backbone.Collection.extend({
    model: NodeModel,
    constructor: function WorkflowTemplates(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options);
      this.columnTypes = {};
      this.columns = new ColumnCollection();
      this.widgetName = options.widgetName;
    },
    url: function() {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_WORKFLOWS_TEMPLATES), extraParams = {};
      if (this.widgetName) {
        extraParams["wf-overview-widget-name"] = this.widgetName;
      }
      return serverQueryUtils.appendQueryParams(url, {
        scope: this,
        sort: this.sort,
        orderBy: this.orderBy,
        extraParams: extraParams
      });
    },
    parse: function(response) {
      return (response.entries || []).map(function(entry) {
        return entry.content;
      });
    },
    sync: function(method, response, options) {
      var promise = $.Deferred();
      if (method === "read") {
        if (!this.clientColumns) {
          this.setColumnPreferences();
        }
        this.fetchWorkflowTemplatesData(method, response, options).done(function() {
          promise.resolve();
        }).fail(function(err) {
          promise.reject(err);
        });
      } else {
        throw new Error("Only fetching workflow templates collection is supported");
      }
      return promise.promise();
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
        default_action: true,
        definitions_order: 511,
        direction: "Desc",
        isNaming: true,
        key: "name",
        name: "name",
        repeating: false,
        sort: true,
        title: lang.workflowTemplateColumnName,
        type: -1,
        type_name: "String"
      });
      response.columns.push({
        column_key: "owner_user_id",
        d2_sort_key: "owner_user_id",
        definitions_order: 561,
        direction: "",
        filter: true,
        key: "owner_user_id",
        name: "owner_user_id",
        repeating: false,
        sort: true,
        title: lang.workflowTemplateColumnOwner,
        type: -1,
        type_name: "String"
      });
      response.columns.push({
        column_key: "r_version_label",
        d2_sort_key: "r_version_label",
        definitions_order: 561,
        direction: "",
        filter: true,
        key: "r_version_label",
        name: "r_version_label",
        repeating: true,
        sort: true,
        title: lang.workflowTemplateColumnVersion,
        type: -1,
        type_name: "String"
      });
      this.clientColumns = response.columns;
      this.columns.reset(this.clientColumns);
    },
    fetchWorkflowTemplatesData: function(method, response, options) {
      var me = this, promise = $.Deferred();
      var oldSuccess = options.success;
      options.success = function(response, status, xhr) {
        if (response.entries) {
          me.fetchDataForObjects(response).done(function(response) {
            oldSuccess.call(options.context, response, status, xhr);
            promise.resolve();
          }).fail(function(error) {
            promise.reject(error);
          });
        } else {
          oldSuccess.call(options.context, response, status, xhr);
          promise.resolve();
        }
      };
      options.error = function(xhr) {
        var responseCustom = {
          entries: []
        };
        xhr.status = 200;
        xhr.statusText = "Success";
        oldSuccess.call(options.context, responseCustom, "success", xhr);
        promise.resolve();
      };
      Backbone.sync.call(me, method, response, options);
      return promise.promise();
    },
    fetchDataForObjects: function(response) {
      var promise = $.Deferred();
      var objectIDs = response.entries.map(function(model) {
        return model.content["r_object_id"];
      });
      var parameters = {
        ids: objectIDs,
        connector: this.connector,
        permissions: {
          permissionLevel: "read"
        }
      };
      serverQueryUtils.fetchDataForObjects(parameters).done(function(output) {
        _.each(response.entries, function(item) {
          var id = item.content["r_object_id"];
          item.content["base-permissions"] = output.permissions[id] ? output.permissions[id]["base-permission"] : {};
        });
        promise.resolve(response);
      }).fail(function(err) {
        promise.reject(err);
      });
      return promise.promise();
    }
  });
  ClientSideBrowsableMixin.mixin(WorkflowTemplates.prototype);
  BrowsableV2ResponseMixin.mixin(WorkflowTemplates.prototype);
  ConnectableMixin.mixin(WorkflowTemplates.prototype);
  FetchableMixin.mixin(WorkflowTemplates.prototype);
  WorkflowTemplates.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, RestResources.getCurrentUser().get("preferences").order_folder_before !== false, this.orderBy);
  };
  return WorkflowTemplates;
});