/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "nuc/models/browsable/client-side.mixin", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.event", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants" ], function(_, $, Backbone, Url, ClientSideBrowsableMixin, NodeResourceMixin, DelayedCommandableV2Mixin, WorkflowAuditTask, WorkflowAuditEvent, RestLinkrels, serverQueryUtils, constants, widgetConstants) {
  "use strict";
  var DEFAULT_PROPERTIES_INHERITED_FROM_NODE = [ "wf_sv_disable_notes", "wf_sv_disable_supporting_files", "wf_working_documents_count", "wf_supporting_documents_count", "workflow_start_activity_package_type" ], DEFAULT_LINKS_INHERITED_FROM_NODE = [];
  var WorkflowAuditCollection = Backbone.Collection.extend({
    model: function(attrs, options) {
      options = options || {};
      options.widgetName = options.collection.widgetName;
      options.widgetType = options.collection.widgetType;
      var props = attrs.properties;
      return _.has(props, "activity_type") ? new WorkflowAuditTask(attrs, options) : new WorkflowAuditEvent(attrs, options);
    },
    _prepareModel: function(attrs, options) {
      options.inheritNodeProperties = this.inheritNodePropertiesToEvents;
      options.parentTreeNode = this.parentTreeNode;
      options.applyCombinedTaskState = this.applyCombinedTaskState;
      options.node = this.node;
      return Backbone.Collection.prototype._prepareModel.apply(this, arguments);
    },
    constructor: function WorkflowAuditCollection(models, options) {
      options = options || {};
      options.expanded = false;
      this.inheritableNodeProperties = options.inheritableNodeProperties || DEFAULT_PROPERTIES_INHERITED_FROM_NODE;
      this.inheritableNodeLinks = options.inheritableNodeLinks || DEFAULT_LINKS_INHERITED_FROM_NODE;
      this.inheritNodePropertiesToEvents = options.inheritNodePropertiesToEvents;
      this.parentTreeNode = options.parentTreeNode;
      this.applyCombinedTaskState = options.applyCombinedTaskState;
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
        menuType: constants.MenuTypes.TASKS,
        widgetType: widgetConstants.D2.TASKS
      };
      options.delayedActionsOptions = options.d2ActionsOptions;
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      if (options.delayRestCommands === true && options.promoteSomeRestCommands === false) {
        options.delayedActionsOptions = _.extend({
          isNonPromoted: false
        }, options.delayedActionsOptions);
      }
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeNodeResource(options).makeClientSideBrowsable(options).makeDelayedCommandableV2(options);
      this.delayedActions.sync = function(method, model, options) {
        var promise = $.Deferred();
        if (this.nodes && this.nodes.length > 0 && !this.nodes[0]) {
          options.success.call(options.context, [], "success", {});
          promise.resolve();
        } else {
          var serverQueryOptions = {
            ids: this.nodes,
            connector: this.connector,
            actions: {
              menuType: this.menuType || constants.MenuTypes.CONTEXT,
              widgetType: this.widgetType || widgetConstants.D2.DOCLIST
            }
          };
          serverQueryUtils.fetchDataForObjects(serverQueryOptions).done(function(output) {
            var actions = output.actions;
            actions = _.map(actions, function(data, key) {
              return {
                id: key,
                actions: data
              };
            });
            options.success.call(options.context, actions, "success", {});
            promise.resolve();
          }).fail(function(err) {
            promise.reject(err);
          });
        }
        return promise.promise();
      };
      this.widgetName = options.widgetName || this.node.widgetName;
      this.widgetType = options.widgetType || this.node.widgetType;
      this.fetchWfEvents = options.fetchWfEvents;
    },
    baseUrl: function() {
      return RestLinkrels.getLink(this.node.get("links"), RestLinkrels.SELF);
    },
    url: function() {
      var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_WORKFLOW_TASKS), qParams = {
        inline: true,
        links: true
      };
      if (this.widgetName) {
        qParams["wf-overview-widget-name"] = this.widgetName;
      }
      if (this.workflowFilterName) {
        qParams["filterName"] = this.workflowFilterName;
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      return url;
    },
    sync: function(method, collection, options) {
      if (method !== "read") {
        throw new Error("Only fetching audits is supported");
      }
      if (options.filterName) {
        this.workflowFilterName = options.filterName;
      } else {
        this.workflowFilterName = "";
      }
      this.allAuditEvents = [];
      collection.each(function(model) {
        this.allAuditEvents[model.get("workitem_id") || model.get("id")] = model.auditEvents;
      }.bind(this));
      var dfd = $.Deferred(), me = this, origSuccess = options.success;
      options.success = function(response, status, xhr) {
        if (me.fetchWfEvents !== false) {
          me.fetchWorkflowEvents(response).done(function() {
            origSuccess && origSuccess.call(options.context, response, status, xhr);
            dfd.resolve();
          }).fail(function() {
            options.error && options.error.apply(options.context, arguments);
            dfd.reject.apply(dfd, arguments);
          });
        } else {
          origSuccess && origSuccess.call(options.context, response, status, xhr);
          dfd.resolve();
        }
      };
      Backbone.Collection.prototype.sync.call(this, method, collection, options).fail(dfd.reject);
      return dfd.promise();
    },
    fetchWorkflowEvents: function(response) {
      var url = Url.combine(this.baseUrl(), "audits"), qParams = {
        inline: true
      };
      if (this.widgetName) {
        qParams["wf-overview-widget-name"] = this.widgetName;
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      return $.ajax(this.connector.extendAjaxOptions({
        url: url,
        type: "GET",
        success: function(resp) {
          response.entries = (response.entries || []).concat(resp.entries || []);
        }
      }));
    },
    parse: function(response) {
      var me = this;
      return _.map(response.entries || [], function(item) {
        var content = item.content, properties = content.properties || {};
        content.properties = _.defaults(properties, {
          r_object_id: item.id,
          links: (content.links || []).concat(_.filter(me.node.get("links") || [], function(l) {
            return _.includes(me.inheritableNodeLinks, l.rel);
          }))
        }, _.pick(me.node.attributes, me.inheritableNodeProperties));
        content.properties["has_events"] = !!RestLinkrels.getLink(content.properties.links, RestLinkrels.D2_WORKFLOW_TASK_AUDITS);
        return content;
      });
    },
    updateActions: function() {
      this.each(function(model) {
        model.set("csuiLazyActionsRetrieved", true, {
          silent: true
        });
      });
      this._updateOriginalActions();
    },
    clone: function() {
      var clone = new this.constructor(this.models, this.options);
      clone.actualSkipCount = this.actualSkipCount;
      clone.skipCount = this.skipCount;
      clone.topCount = this.topCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      clone.filters = _.deepClone(this.filters);
      clone.orderBy = this.orderBy;
      return clone;
    }
  });
  NodeResourceMixin.mixin(WorkflowAuditCollection.prototype);
  ClientSideBrowsableMixin.mixin(WorkflowAuditCollection.prototype);
  DelayedCommandableV2Mixin.mixin(WorkflowAuditCollection.prototype);
  WorkflowAuditCollection.prototype._requestDelayedActions = function() {
    if (this.node.get("d2_workflow_state") === constants.WorkflowState.ABORTED || this.node.get("d2_workflow_state") === constants.WorkflowState.FINISHED) {
      this.each(function(model) {
        model.set("csuiDelayedActionsRetrieved", true, {
          silent: true
        });
        model.set("csuiLazyActionsRetrieved", true, {
          silent: true
        });
      });
      return;
    }
    var defaultActionCommands = this.defaultActionCommands;
    var restCommands = _.reject(this.commands, function(command) {
      return _.contains(defaultActionCommands, command);
    });
    if (restCommands.length) {
      var delayedActions = this.delayedActions;
      delayedActions.resetCommands();
      delayedActions.setCommands(restCommands);
      delayedActions.resetNodes();
      this.each(function(model) {
        if (model.get("task_state") === constants.WorkflowTaskState.FUTURE) {
          model.set("csuiDelayedActionsRetrieved", true, {
            silent: true
          });
          model.set("csuiLazyActionsRetrieved", true, {
            silent: true
          });
        }
      });
      delayedActions.setNodes(_.map(this.filter(function(m) {
        return !m.get("csuiDelayedActionsRetrieved");
      }), function(m) {
        return m.get("id");
      }));
      if (!delayedActions.connector) {
        this.connector.assignTo(delayedActions);
      }
      delayedActions.parent_id = this.node ? this.node.get("id") : this.get("id");
      delayedActions.fetch({
        success: this.updateActions.bind(this),
        reset: true
      });
    }
  };
  return WorkflowAuditCollection;
});