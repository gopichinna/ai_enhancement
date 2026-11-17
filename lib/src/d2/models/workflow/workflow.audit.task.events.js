/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/types/date", "nuc/utils/url", "nuc/models/browsable/client-side.mixin", "nuc/models/mixins/node.resource/node.resource.mixin", "nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin", "d2/models/workflow/workflow.audit.task.event", "d2/utils/rest.linkrels" ], function(_, $, Backbone, date, Url, ClientSideBrowsableMixin, NodeResourceMixin, DelayedCommandableV2Mixin, WorkflowAuditTaskEvent, RestLinkrels) {
  "use strict";
  var DEFAULT_PROPERTIES_NOT_INHERITED_FROM_NODE = [ "has_events", "is_note_present", "performer_type" ];
  var WorkflowAuditTaskEventCollection = Backbone.Collection.extend({
    model: WorkflowAuditTaskEvent,
    comparator: function(l, r) {
      var lDate = date.deserializeDate(l.get("time_stamp")) || new Date(), rDate = date.deserializeDate(r.get("time_stamp")) || new Date();
      return lDate.getTime() - rDate.getTime();
    },
    constructor: function WorkflowAuditTaskEventCollection(models, options) {
      options = options || {};
      options.expanded = false;
      this.node = options.node;
      this.inheritNodeProperties = options.inheritNodeProperties;
      this.parentTreeNode = options.parentTreeNode;
      this.nonInheritableNodeProperties = options.nonInheritableNodeProperties || DEFAULT_PROPERTIES_NOT_INHERITED_FROM_NODE;
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeNodeResource(options).makeClientSideBrowsable(options).makeDelayedCommandableV2(options);
      this.widgetName = options.widgetName || this.node.widgetName;
      this.widgetType = options.widgetType || this.node.widgetType;
      this.on("sync", this._updateActionsFromNode);
    },
    _prepareModel: function(attrs, options) {
      options.inheritNodeProperties = this.inheritNodeProperties;
      options.parentTreeNode = this.parentTreeNode;
      return Backbone.Collection.prototype._prepareModel.apply(this, arguments);
    },
    _updateActionsFromNode: function() {
      this.each(function(node) {
        if (this.inheritNodeProperties !== false) {
          node.actions = this.node.actions;
        } else {
          node.set("csuiDelayedActionsRetrieved", true, {
            silent: true
          });
          node.set("csuiLazyActionsRetrieved", true, {
            silent: true
          });
        }
      }.bind(this));
    },
    url: function() {
      var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_WORKFLOW_TASK_AUDITS), qParams = {
        inline: true,
        links: true
      };
      if (this.widgetName) {
        qParams["wf-overview-widget-name"] = this.widgetName;
      }
      url = Url.appendQuery(url, Url.combineQueryString(qParams));
      return url;
    },
    parse: function(response) {
      var me = this;
      return _.map(response.entries || [], function(item) {
        var content = item.content, properties = content.properties || {};
        content.properties = _.defaults(properties, {
          id: me.inheritNodeProperties !== false ? me.node.get("id") : item.id,
          eventId: item.id,
          links: (content.links || []).concat(me.node.get("links") || [])
        }, _.omit(me.node.attributes, function(value, key) {
          return _.contains(me.nonInheritableNodeProperties, key) || me.inheritNodeProperties === false;
        }));
        return content;
      });
    }
  });
  NodeResourceMixin.mixin(WorkflowAuditTaskEventCollection.prototype);
  ClientSideBrowsableMixin.mixin(WorkflowAuditTaskEventCollection.prototype);
  DelayedCommandableV2Mixin.mixin(WorkflowAuditTaskEventCollection.prototype);
  return WorkflowAuditTaskEventCollection;
});