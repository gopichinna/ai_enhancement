/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "nuc/utils/url", "d2/server.adaptors/converters/task", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants" ], function(_, $, Backbone, NodeModel, Url, taskConverter, RestLinkrels, RestResources, serverQueryUtils, constants, widgetConstants) {
  "use strict";
  return NodeModel.extend({
    defaults: {
      d2_task_priority: 0
    },
    constructor: function TaskModel(attributes, options) {
      options = options || {};
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.TASKS,
        widgetType: widgetConstants.D2.TASKS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      NodeModel.prototype.constructor.apply(this, arguments);
      this.fetchNotesCount = options.fetchNotesCount;
      this.fetchSupportingDocumentsCount = options.fetchSupportingDocumentsCount;
    },
    url: function() {
      var id = this.get("id");
      if (!id) {
        throw new Error("Task creation not supported via model");
      }
      var href = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "d2-tasks", this.get("id")), qParams = {};
      if (this.fetchNotesCount) {
        qParams["include-notes-count"] = this.fetchNotesCount;
      }
      if (this.fetchSupportingDocumentsCount) {
        qParams["include-supporting-documents-count"] = this.fetchSupportingDocumentsCount;
      }
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      return href;
    },
    parse: function(response, options) {
      this._clearPrevResidualAttrs(options);
      var properties = taskConverter.convertTask(response);
      properties["d2_task_priority"] = properties["d2_task_priority"] || this.defaults["d2_task_priority"];
      return properties;
    },
    sync: function(method, model, options) {
      if (method !== "read") {
        throw new Error("Only fetching the task is supported");
      }
      var me = this, dfd = $.Deferred(), oldSuccess = options.success, oldError = options.error;
      if (options.resolveWidgetColumns === true && options.url) {
        options.url = Url.appendQuery(options.url, Url.combineQueryString({
          "widget-name": me.widgetName,
          "widget-type": me.widgetType
        }));
      }
      options.error = function(xhr) {
        if (xhr) {
          if (options.converForbiddenItemToDummyModel === true && xhr.status === 403) {
            options.success({
              properties: {
                r_object_id: me.attributes.id,
                task_state: "unavailable",
                delete_flag: true,
                is_manual_acquisition_required: true,
                is_read: true
              }
            }, "success", xhr);
            dfd.resolve();
            return;
          }
          if (xhr.responseText) {
            xhr.responseText = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : xhr.responseText;
          }
        }
        oldError && oldError.apply(options.context, arguments);
        dfd.reject.apply(dfd, arguments);
      };
      options.success = function(model, status, xhr) {
        if (model.properties.delete_flag) {
          model.properties.actions = [];
          oldSuccess.call(options.context, model, status, xhr);
          dfd.resolve();
        } else {
          var id = model.properties.r_object_id, params = {
            actions: {
              menuType: constants.MenuTypes.TASKS,
              widgetType: widgetConstants.D2.TASKS
            },
            ids: [ id ],
            connector: me.connector
          };
          if (me.limitedCollection === true) {
            params.actions.queryAction = "PROMOTED";
          }
          serverQueryUtils.fetchDataForObjects(params).done(function(output) {
            model.properties.actions = output.actions && output.actions[id] || [];
            me._fetchWorkflowConfig(model).done(function() {
              oldSuccess.call(options.context, model, status, xhr);
              dfd.resolve();
            }).fail(function() {
              options.error.apply(options.context, arguments);
              dfd.reject.apply(dfd, arguments);
            });
          }).fail(function() {
            options.error.apply(options.context, arguments);
            dfd.reject.apply(dfd, arguments);
          });
        }
      };
      Backbone.Model.prototype.sync.call(me, method, model, options);
      return dfd.promise();
    },
    _fetchWorkflowConfig: function(response) {
      var url = RestLinkrels.getLink(response.links || [], RestLinkrels.D2_WORKFLOW_CONFIG);
      if (url) {
        if (this.workflowConfig) {
          _.defaults(response, this.workflowConfig);
          return $.Deferred().resolve().promise();
        } else {
          return $.ajax(this.connector.extendAjaxOptions({
            url: url,
            success: configResp => {
              this.workflowConfig = configResp;
              _.defaults(response, configResp);
            }
          }));
        }
      } else {
        return $.Deferred().resolve().promise();
      }
    },
    clone: function() {
      var clone = NodeModel.prototype.clone.apply(this, arguments);
      clone.fetchNotesCount = this.fetchNotesCount;
      clone.fetchSupportingDocumentsCount = this.fetchSupportingDocumentsCount;
      return clone;
    }
  });
});