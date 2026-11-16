/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "nuc/models/mixins/v2.expandable/v2.expandable.mixin", "nuc/utils/url", "d2/models/workflow/task", "d2/models/workflow/task.file", "d2/models/workflow/task.files.columns", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/server.adaptors/converters/servercolumns", "dctmw/models/mixins/collection.delayed.data.mixin", "d2/server.adaptors/models/d2.fetchable.mixin", "d2/utils/constants", "d2/utils/widget.constants", "d2/utils/server.query.utils", "d2/utils/sort.utils" ], function(_, $, Backbone, Marionette, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, NodeResourceMixin, DelayedCommandableV2Mixin, ExpandableV2Mixin, Url, TaskModel, TaskFile, TasksFilesColumnCollection, WorkflowModel, WorkflowAuditTask, WorkflowAuditTaskEvent, serverColumnsConverter, DelayedDataMixin, D2FetchableMixin, constants, widgetConstants, serverQueryUtils, sortUtils) {
  "use strict";
  var TaskFileCollection = Backbone.Collection.extend({
    model: TaskFile,
    widgetType: widgetConstants.D2.TASK_ATTACHMENTS,
    constructor: function TaskFileCollection(models, options) {
      _.defaults(options, {
        orderBy: "name asc"
      });
      this.options = {};
      var actionCommands = options.toolbarItems && options.toolbarItems.collection.reject(function(ti) {
        return ti.get("signature") === "disabled";
      }), promotedActionCommands = [], nonPromotedActionCommands = [];
      _.each(actionCommands, function(ti) {
        if (ti.get("promoted") === true) {
          promotedActionCommands.push(ti.get("signature").toLowerCase());
        } else {
          nonPromotedActionCommands.push(ti.get("signature").toLowerCase());
        }
      });
      options.promotedActionCommands = promotedActionCommands;
      options.nonPromotedActionCommands = nonPromotedActionCommands;
      options.delayRestCommands = _.isBoolean(options.delayRestCommands) ? options.delayRestCommands : true;
      options.promoteSomeRestCommands = _.isBoolean(options.promoteSomeRestCommands) ? options.promoteSomeRestCommands : promotedActionCommands.length !== 0;
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.TASK_DOCUMENTS,
        widgetType: widgetConstants.D2.TASK_ATTACHMENTS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      this.fetchRelationsCount = options.fetchRelationsCount;
      this.columnTypes = {};
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.options.widgetName = options.widgetName || options.options && options.options.widgetName;
      this.options.expanded = options.expanded || options.options && options.options.expanded || false;
      this.makeNodeResource(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options).makeDelayedCommandableV2(options).makeExpandableV2(options).enableDelayedDataFetch(options).makeD2Fetchable(options);
      this.columns = new TasksFilesColumnCollection(options.columns);
    },
    _getAttachmentFetchLink: function() {},
    url: function() {
      var href = this._getAttachmentFetchLink(), qParams = {
        inline: true,
        links: true
      };
      if (this.node instanceof TaskModel && !(this.node instanceof WorkflowAuditTask || this.node instanceof WorkflowAuditTaskEvent)) {
        qParams["task-id"] = this.node.get("id");
      } else if (this.node instanceof WorkflowModel || this.node instanceof WorkflowAuditTask || this.node instanceof WorkflowAuditTaskEvent) {
        let viewStateModel = this.node.connector.context.viewStateModel;
        qParams["wf-overview-widget-name"] = viewStateModel.getDefaultViewState("widget_name") || viewStateModel.getViewState("widget_name");
      }
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      return href;
    },
    sync: function(method, response, options) {
      var promise = $.Deferred();
      var me = this, widgetConfig;
      if (me.expanded || me.options.expanded) {
        me.expanded = true;
        if (me.options.widgetName) {
          widgetConfig = serverQueryUtils.getWidgetConfig(widgetConstants.D2.TASK_ATTACHMENTS, me.options.widgetName);
        }
      }
      me.fetchColumnPreferences(me.options.widgetName, widgetConfig).done(function() {
        me.fetchTaskFilesData(method, response, options).done(function() {
          promise.resolve();
        }).fail(function(err) {
          promise.reject(err);
        });
      }).fail(function(err) {
        promise.reject(err);
      });
      return promise.promise();
    },
    fetchTaskFilesData: function(method, collection, options) {
      var deferred = $.Deferred(), me = this, originalSuccess = options.success, originalError = options.error;
      options.error = function() {
        originalError.apply(options.context, arguments);
        deferred.reject.apply(this, arguments);
      };
      options.success = function() {
        originalSuccess.apply(options.context, arguments);
        deferred.resolve();
      };
      Backbone.sync.call(me, method, collection, options);
      return deferred.promise();
    },
    fetchColumnPreferences: function(wName, widgetConfig) {
      var me = this, promise = $.Deferred();
      if (!me.expanded) {
        promise.resolve();
      } else {
        serverQueryUtils.fetchColumnPreferences({
          scope: me,
          widgetType: me.widgetType,
          widgetName: wName,
          connector: me.connector
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
          me.clientColumns = clientCols;
          _.each(clientCols, function(col) {
            if (col.sort === true && col.direction) {
              me.orderBy = col.column_key + " " + col.direction.toLowerCase();
            }
            if (col.filter !== false && (col.type === 2 || col.type === -1)) {
              col.filter = true;
              col.filter_key = col.filter_key || col.column_key;
            }
          });
          me.columns.reset(me.clientColumns);
          me.columnTypes = {};
          me.widgetPreference = {
            widgetName: wName,
            widgetType: me.widgetType,
            columnPreference: me.columnPreference,
            clientColumns: clientCols,
            widgetConfig: widgetConfig
          };
          promise.resolve();
        }).fail(function(err) {
          promise.reject(err);
        });
      }
      return promise.promise();
    },
    _saveColumnPreference: function() {
      var sortarr = _.isString(this.orderBy) ? this.orderBy.split(" ") : [], me = this;
      if (sortarr.length > 1) {
        serverQueryUtils.saveColumnPreferences({
          scope: me,
          widgetType: me.widgetType,
          widgetName: me.options.widgetName,
          connector: me.connector,
          columnPreference: me.columnPreference,
          sortOrder: me.orderBy
        }).done(function(clientCols, columnPreference) {
          me.columnPreference = columnPreference;
        });
      }
    },
    _prepareModel: function(attrs, options) {
      options || (options = {});
      options.promotedActionCommands = this.promotedActionCommands;
      options.nonPromotedActionCommands = this.nonPromotedActionCommands;
      return Backbone.Collection.prototype._prepareModel.call(this, attrs, options);
    },
    parse: function(response) {
      return _.isArray(response.entries) ? _.map(response.entries, function(entry) {
        var obj = entry.content;
        _.extend(obj.properties, {
          id: entry.id
        });
        return obj;
      }) : [];
    },
    fetchDelayedData: function(options) {
      options = options || {};
      var me = this, parameters = {
        ids: options.nodes,
        connector: me.node.connector,
        permissions: {
          permissionLevel: "read"
        },
        relationsCount: this.fetchRelationsCount
      };
      if (me.options.expanded) {
        _.extend(parameters, {
          favorites: true
        });
      }
      return serverQueryUtils.fetchDataAsPropertiesForObjects(parameters);
    }
  });
  NodeResourceMixin.mixin(TaskFileCollection.prototype);
  ClientSideBrowsableMixin.mixin(TaskFileCollection.prototype);
  BrowsableV2ResponseMixin.mixin(TaskFileCollection.prototype);
  DelayedCommandableV2Mixin.mixin(TaskFileCollection.prototype);
  ExpandableV2Mixin.mixin(TaskFileCollection.prototype);
  DelayedDataMixin.mixin(TaskFileCollection.prototype);
  D2FetchableMixin.mixin(TaskFileCollection.prototype);
  var originalFetch = TaskFileCollection.prototype.fetch;
  TaskFileCollection.prototype.fetch = function(options) {
    if (this._lastFilterAndSortCriteria && !_.isEqual(this.orderBy, this._lastFilterAndSortCriteria.orderBy) && this.columnPreference) {
      this._saveColumnPreference();
    }
    return originalFetch.call(this, options);
  };
  TaskFileCollection.prototype.compareObjectsForSort = function(property, left, right) {
    var sortSchema = this.columnTypes[property];
    if (!sortSchema) {
      this.columnTypes[property] = {};
      sortSchema = serverColumnsConverter.getSortColumnSchema(this.clientColumns, property);
      this.columnTypes[property] = sortSchema;
    }
    return sortUtils.compare(sortSchema.key, left, right, sortSchema.type, false);
  };
  return TaskFileCollection;
});