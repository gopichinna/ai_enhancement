/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/columns", "nuc/models/actions", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/browsable/client-side.mixin", "nuc/models/node/node.model", "d2/models/table/column.preference", "d2/server.adaptors/converters/servercolumns", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants", "dctmw/utils/rest.resources", "d2/utils/task.utils", "i18n!d2/widgets/metadata/panels/task.performers/impl/nls/lang" ], function($, _, Backbone, Url, NodeColumnCollection, ActionCollection, NodeResourceMixin, ClientSideBrowsableMixin, NodeModel, ColumnPreferenceModel, serverColumnsConverter, RestLinkrels, serverQueryUtils, constants, widgetConstants, RestResources, taskUtils, lang) {
  "use strict";
  var TaskPerformersModel = NodeModel.extend({
    url: function() {
      return RestLinkrels.getLink(this.get("links"), RestLinkrels.SELF);
    }
  });
  var TaskPerformersCollection = Backbone.Collection.extend({
    constructor: function TaskPerformersCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeNodeResource(options).makeClientSideBrowsable(options);
      this.columns = new NodeColumnCollection();
      this.wfWidgetName = options && options.wfWidgetName;
      this.columnTypes = {};
    },
    model: TaskPerformersModel,
    url: function() {
      var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_TASK_PERFORMERS);
      var queryMap = {};
      if (this.wfWidgetName) {
        queryMap["wf-overview-widget-name"] = this.wfWidgetName;
      }
      url = Url.appendQuery(url, Url.combineQueryString(queryMap));
      return url;
    },
    sync: function(method, collection, options) {
      if (method === "read") {
        this.fetchColumnPreferences();
        return this.fetchTaskPerformerModel(method, collection, options);
      } else {
        return Backbone.Collection.prototype.sync.apply(this, arguments);
      }
    },
    fetchColumnPreferences: function() {
      if (this.clientColumns && this.clientColumns.length > 0) {
        this.columns.reset(this.clientColumns);
      } else {
        var colPref = new ColumnPreferenceModel({
          colType: "detail_workflow_performers"
        });
        colPref.columns = new Backbone.Collection([ {
          displaytype: 2,
          label: lang.PerformerColumnCaption,
          name: "performer_label",
          type: 2
        }, {
          displaytype: 2,
          label: lang.TypeColumnCaption,
          name: "performer_type",
          type: 2
        }, {
          displaytype: 2,
          label: lang.UsernameColumnCaption,
          name: "d2_performer_value",
          type: 2
        } ]);
        var clientColumns = serverColumnsConverter.convertColumns(colPref, {
          typeColumn: true,
          favoriteColumn: false,
          reservedColumn: false,
          externalShareColumn: false,
          inlineRowActions: true
        }, {});
        var performerValueColumn = _.findWhere(clientColumns, {
          key: "d2_performer_value"
        });
        if (performerValueColumn) {
          performerValueColumn.sort = false;
        }
        this.columnPreference = colPref;
        this.clientColumns = clientColumns;
        this.columns.reset(this.clientColumns);
        this.columnTypes = {};
      }
    },
    fetchTaskPerformerModel: function(method, collection, options) {
      var me = this, promise = $.Deferred();
      var oldSuccess = options.success;
      options.parse = false;
      options.headers = options.headers || {};
      options.success = function(response, status, xhr) {
        var taskPerformerModelData = taskUtils.getTaskPerformerAliasList(response, me.node);
        oldSuccess.call(options.context, taskPerformerModelData, status, xhr);
        promise.resolve();
      };
      Backbone.sync.call(me, method, collection, options).fail(promise.reject);
      return promise.promise();
    }
  });
  ClientSideBrowsableMixin.mixin(TaskPerformersCollection.prototype);
  NodeResourceMixin.mixin(TaskPerformersCollection.prototype);
  return TaskPerformersCollection;
});