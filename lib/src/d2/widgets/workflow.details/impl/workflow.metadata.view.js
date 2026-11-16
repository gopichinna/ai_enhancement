/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/utils/url", "d2/models/workflow/workflow", "d2/models/workflow/workflow.audit.task.event", "d2/widgets/taskstable/task.toolbaritems", "d2/widgets/taskstable/task.toolbaritems.masks", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/utils/rest.linkrels", "d2/widgets/task.details/impl/task.metadata.view", "i18n!d2/widgets/task.details/impl/nls/lang" ], function($, _, Marionette, Url, WorkflowModel, WorkflowAuditTaskEvent, TaskToolItems, TaskToolItemsMasks, constants, RestResources, RestLinkrels, TaskMetadataView, TaskDetailsLang) {
  "use strict";
  var WorkflowMetadataView = TaskMetadataView.extend({
    constructor: function WorkflowMetadataView(options) {
      options = options || {};
      TaskMetadataView.prototype.constructor.call(this, options);
      this.listenTo(this.metadataTabView, "activate:tab", this._attachDetachSelectionContextChangeListener);
    },
    _attachDetachSelectionContextChangeListener: function() {
      this._lastActiveTabContent && this.stopListening(this._lastActiveTabContent, "change:selection:context");
      this._lastActiveTabContent = this.metadataTabView.activeTabContent;
      this._lastActiveTabContent && this.listenTo(this._lastActiveTabContent, "change:selection:context", this.onChangeSelectionContext);
    },
    _listenToDropdownSelection: function() {
      this._attachDetachSelectionContextChangeListener();
      TaskMetadataView.prototype._listenToDropdownSelection.apply(this, arguments);
    },
    onChangeSelectionContext: function(model) {
      if (!(model instanceof WorkflowModel) && model.get("task_state") !== constants.WorkflowTaskState.FUTURE && model.get("wf_sv_disable_notes") !== true && _.isUndefined(model.get("wf_notes_count"))) {
        if (model instanceof WorkflowAuditTaskEvent && !_.isUndefined(model.collection.node.get("wf_notes_count"))) {
          model.set("wf_notes_count", model.collection.node.get("wf_notes_count"), {
            silent: true
          });
        } else {
          var url = RestLinkrels.getLink(model.get("links"), RestLinkrels.D2_NOTES_COUNT), qParams = {
            "filter-by": "task",
            "wf-overview-widget-name": this.model.connector.context.viewStateModel.getDefaultViewState("widget_name")
          };
          url = Url.appendQuery(url, Url.combineQueryString(qParams));
          $.ajax(model.connector.extendAjaxOptions({
            url: url,
            success: function(response) {
              model.set("wf_notes_count", response.count, {
                silent: true
              });
              if (model instanceof WorkflowAuditTaskEvent) {
                model.collection.node.set("wf_notes_count", response.count, {
                  silent: true
                });
              }
              this.updateNotesTabHeader(model.get("wf_notes_count"));
            }.bind(this)
          }));
        }
      } else if (model instanceof WorkflowAuditTaskEvent && model.get("task_state") !== constants.WorkflowTaskState.FUTURE && model.get("wf_sv_disable_notes") !== true) {
        model.set("wf_notes_count", model.collection.node.get("wf_notes_count"), {
          silent: true
        });
      }
      if (!(model instanceof WorkflowModel)) {
        model.set("wf_supporting_documents_count", this.model.get("wf_supporting_documents_count"));
      }
      if (!(model instanceof WorkflowModel) && model.get("task_state") !== constants.WorkflowTaskState.FUTURE) {
        model.off("change:wf_notes_count", this.updateNotesCount, this);
        model.off("change:wf_supporting_documents_count", this.updateSupportingFilesCount, this);
        this.listenTo(model, "change:wf_notes_count", this.updateNotesCount);
        this.listenTo(model, "change:wf_supporting_documents_count", this.updateSupportingFilesCount, this);
      }
      this.destroyAndCreateAdditionalPanelsView(model);
    },
    destroyAndCreateAdditionalPanelsView: function(model) {
      this.taskAdditionalPanelsView && this.taskAdditionalPanelsView.destroy();
      var extendedOptions = model instanceof WorkflowModel ? {
        model: model
      } : {
        toolbarItems: _.extend({}, TaskToolItems),
        toolbarItemsMasks: new TaskToolItemsMasks(),
        model: model
      };
      this.taskAdditionalPanelsView = this.createAdditionalPanelView(_.extend({}, this.options, extendedOptions));
      if (this.isRendered) {
        this.renderAdditionalPanelsView();
      }
    },
    updateNotesCount: function(model, count) {
      var countChange = count - model._previousAttributes.wf_notes_count;
      countChange >= 1 && this.model.set("wf_notes_count", this.model.get("wf_notes_count") + countChange);
      model instanceof WorkflowAuditTaskEvent && model.collection.node.set("wf_notes_count", model.get("wf_notes_count"), {
        silent: true
      });
    },
    updateSupportingFilesCount: function(model) {
      this.model.set("wf_supporting_documents_count", model.get("wf_supporting_documents_count"));
    },
    updateNotesTabHeader: function(length) {
      if (this.taskAdditionalPanelsView) {
        this.taskAdditionalPanelsView._updateTabHeaderByTabName("notes", length ? _.str.sformat(TaskDetailsLang.titleAdditionalPanelNotes, length) : TaskDetailsLang.defaultTitleAdditionalPanelNotes);
      }
    }
  });
  return WorkflowMetadataView;
});