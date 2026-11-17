/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/models/browsable/client-side.mixin", "nuc/models/browsable/v2.response.mixin", "nuc/models/mixins/connectable/connectable.mixin", "nuc/models/mixins/fetchable/fetchable.mixin", "nuc/utils/url", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audit.task", "d2/models/workflow/workflow.audit.task.event", "d2/utils/rest.linkrels", "d2/utils/sort.utils" ], function(_, $, Backbone, Marionette, ClientSideBrowsableMixin, BrowsableV2ResponseMixin, ConnectableMixin, FetchableMixin, Url, WorkflowModel, WorkflowAuditTask, WorkflowAuditTaskEvent, RestLinkrels, sortUtils) {
  "use strict";
  var TaskNoteCollection = Backbone.Collection.extend({
    url: function() {
      var href = RestLinkrels.getLink(this.taskModel.get("links"), RestLinkrels.D2_NOTES), qParams = {
        inline: true,
        links: true
      };
      if (_.isNumber(this.topRecords)) {
        qParams["top-records"] = this.topRecords;
      }
      if (!_.isUndefined(this.filterBy)) {
        qParams["filter-by"] = this.filterBy;
      }
      if (this.taskModel instanceof WorkflowModel || this.taskModel instanceof WorkflowAuditTask || this.taskModel instanceof WorkflowAuditTaskEvent) {
        let viewStateModel = this.taskModel.connector.context.viewStateModel;
        qParams["wf-overview-widget-name"] = viewStateModel.getDefaultViewState("widget_name") || viewStateModel.getViewState("widget_name");
      }
      href = Url.appendQuery(href, Url.combineQueryString(qParams));
      return href;
    },
    constructor: function TaskNoteCollection(models, options) {
      options = options || {};
      this.taskModel = options.taskModel;
      this.topRecords = options.topRecords;
      this.filterBy = options.filterBy;
      _.defaults(options, {
        orderBy: "note_date desc"
      });
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeConnectable(options).makeFetchable(options).makeClientSideBrowsable(options).makeBrowsableV2Response(options);
    },
    parse: function(response) {
      this.hasMoreRecords = !!response["has-more-records"];
      var commonOptions = {
        links: response.links,
        total: response.total,
        title: response.title
      };
      return _.isArray(response.entries) ? _.map(response.entries, function(entry) {
        var obj = entry.content;
        _.extend(obj.properties, {
          id: entry.id
        }, commonOptions);
        return obj.properties;
      }) : [];
    }
  });
  ConnectableMixin.mixin(TaskNoteCollection.prototype);
  FetchableMixin.mixin(TaskNoteCollection.prototype);
  ClientSideBrowsableMixin.mixin(TaskNoteCollection.prototype);
  BrowsableV2ResponseMixin.mixin(TaskNoteCollection.prototype);
  TaskNoteCollection.prototype.compareObjectsForSort = function(property, left, right) {
    return sortUtils.compare(property, left, right, -7, false);
  };
  return TaskNoteCollection;
});