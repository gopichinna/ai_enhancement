/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/models/node/node.model", "nuc/utils/url", "d2/models/workflow/workflow.audits", "d2/server.adaptors/converters/workflow", "d2/widgets/taskstable/task.toolbaritems", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants" ], function(_, $, Backbone, NodeModel, Url, WorkflowAuditCollection, workflowConverter, TaskToolItems, RestLinkrels, RestResources, serverQueryUtils, constants, widgetConstants) {
  "use strict";
  return NodeModel.extend({
    defaults: {
      type: constants.Types.WORKFLOW
    },
    constructor: function WorkflowModel(attributes, options) {
      options = options || {};
      let widgetType = options.collection?.widgetType || options.widgetType || widgetConstants.D2.WORKFLOWS;
      options.d2ActionsOptions = options.d2ActionsOptions || {
        menuType: constants.MenuTypes.WORKFLOWS,
        widgetType: widgetType
      };
      options.delayedActionsOptions = _.extend({
        isNonPromoted: true
      }, options.d2ActionsOptions);
      options.nonPromotedActionsOptions = options.d2ActionsOptions;
      NodeModel.prototype.constructor.call(this, attributes, options);
      this.widgetName = options.collection?.widgetName || options.widgetName;
      this.widgetType = widgetType;
      this.detailsView = options.detailsView;
      this.treeChildNodes = new WorkflowAuditCollection(undefined, _.extend({}, options, {
        node: this,
        fetchWfEvents: false,
        delayRestCommands: true,
        promoteSomeRestCommands: false,
        commands: _.chain(TaskToolItems.inlineActionbar.getCollection().pluck("signature")).without("disabled").flatten().compact().invoke("toLowerCase").unique().value(),
        toolbarItems: TaskToolItems.inlineActionbar,
        inheritNodePropertiesToEvents: false,
        parentTreeNode: this,
        applyCombinedTaskState: true
      }));
      this.hasTreeChildNodes = true;
      if (this?.collection?.widgetType === widgetConstants.D2.WORKFLOWS || this?.collection?.widgetType === widgetConstants.D2.ADMIN_WORKFLOWS) {
        this.listenTo(this, "change:csuiDelayedActionsRetrieved", (model, newVal) => {
          this.attributes.csuiLazyActionsRetrieved = newVal;
        });
      }
    },
    url: function() {
      var id = this.get("id");
      if (!id) {
        throw new Error("Workflow creation not supported via model");
      }
      var href = Url.combine(RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.SELF), "d2-workflows", this.get("id")), qParams = {
        inline: true
      };
      if (this.widgetName) {
        qParams["wf-overview-widget-name"] = this.widgetName;
      }
      if (this.options.fetchWorkingDocumentsCount !== false) {
        qParams["include-working-documents-count"] = true;
      }
      if (this.options.fetchSupportingDocumentsCount !== false) {
        qParams["include-supporting-documents-count"] = true;
      }
      if (this.options.fetchNotesCount !== false) {
        qParams["include-notes-count"] = true;
      }
      if (this.collection?.widgetType === widgetConstants.D2.FAVORITES) {
        qParams = {
          inline: true
        };
      }
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      return href;
    },
    parse: function(response, options) {
      this._clearPrevResidualAttrs(options);
      return _.defaults(workflowConverter.convertWorkflow(response), _.omit(response, "properties", "links"));
    },
    sync: function(method, model, options) {
      if (method !== "read") {
        throw new Error("Only fetching the workflow is supported");
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
          if (options.converHTTP405ToDummyModel === true && xhr.status === 405) {
            options.success({
              properties: {
                r_object_id: me.attributes.id
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
              menuType: constants.MenuTypes.WORKFLOWS,
              widgetType: me.widgetType
            },
            favorites: me.detailsView !== true,
            ids: [ id ],
            connector: me.connector
          };
          if (me.limitedCollection === true) {
            params.actions.queryAction = "PROMOTED";
          }
          serverQueryUtils.fetchDataForObjects(params).done(function(output) {
            model.properties.actions = output.actions && output.actions[id] || [];
            var favorite = output.favorites && output.favorites[id];
            model.favorite = {
              favorite: favorite ? favorite.favorite : false
            };
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
      url = Url.appendQuery(url, Url.combineQueryString({
        "widget-name": this.widgetName
      }));
      if (url) {
        return $.ajax(this.connector.extendAjaxOptions({
          url: url,
          success: function(configResp) {
            _.defaults(response, _.omit(configResp, "r_object_id"), {
              template_id: configResp["r_object_id"]
            });
          }
        }));
      } else {
        return $.Deferred().reject().promise();
      }
    },
    clone: function() {
      var clone = NodeModel.prototype.clone.apply(this, arguments);
      clone.detailsView = this.detailsView;
      clone.collection = this.collection;
      clone.setNonPromotedActionsOptions({
        menuType: this.nonPromotedActionsOptions.menuType,
        widgetType: this.nonPromotedActionsOptions.widgetType
      });
      clone.widgetName = this.widgetName;
      clone.widgetType = this.widgetType;
      return clone;
    }
  });
});