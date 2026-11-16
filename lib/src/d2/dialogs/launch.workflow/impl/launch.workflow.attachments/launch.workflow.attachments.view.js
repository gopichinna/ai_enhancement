/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabables.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments.panel.view", "d2/models/workflow/task.files", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments", "css!d2/dialogs/launch.workflow/impl/launch.workflow.attachments/launch.workflow.attachments" ], function(_, Marionette, TabablesBehavior, WizardTabableRegionBehavior, LaunchWorkflowAttachmentsPanelView, TaskFileCollection, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-launch-workflow-attachments-dialog",
    template: template,
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      attachmentsContainer: ".d2-launch-workflow-attachments-container"
    },
    constructor: function LaunchWorkflowAttachmentsView(options) {
      options = options || {};
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.currentlyFocusedElement = function(event) {
        var tabElements = this.$(TabablesBehavior.focusablesSelector);
        if (tabElements.length) {
          tabElements.prop("tabindex", 0);
        }
        tabElements = tabElements.filter(":visible:not([disabled])");
        this.attachmentsPanelView.trigger("reset:tabindex");
        if (!!event && event.shiftKey) {
          tabElements = tabElements.filter('[tabindex="0"]');
          return tabElements[tabElements.length - 1];
        } else {
          return tabElements[0];
        }
      };
      this._setupChildView();
    },
    _createTaskCollection: function(isWorkingFile) {
      var collection = new TaskFileCollection(undefined, {
        node: this.options.node,
        fetchRelationsCount: true
      });
      isWorkingFile && collection.add(this.options.node.workingFiles);
      collection.lastFilteredAndSortedModels = collection.models;
      collection._lastFilterAndSortCriteria = {
        orderBy: collection.orderBy,
        filters: _.clone(collection.filters)
      };
      collection.fetched = true;
      collection.fetch({
        reset: false
      });
      return collection;
    },
    _setupChildView: function() {
      var options = _.extend(this.options, {
        originatingView: this,
        workingFileCollection: this._createTaskCollection(true),
        supportingFileCollection: this._createTaskCollection()
      });
      this.attachmentsPanelView = new LaunchWorkflowAttachmentsPanelView(options);
    },
    onShow: function() {
      this.attachmentsContainer.show(this.attachmentsPanelView);
      _.each(this.attachmentsPanelView.tabContent.children._views, function(tabContent) {
        tabContent.content && tabContent.content.trigger("highlight");
        tabContent.content && tabContent.content.collection.fetch({
          reset: false
        });
      });
    },
    isValid: function() {
      return this.options.node.workingFiles && this.options.node.workingFiles.length;
    },
    updateModelData: function() {
      this.options.node.set("working_document_ids", _.map(this.options.node.workingFiles, function(workingFile) {
        return workingFile.get("id");
      }));
      this.options.node.supportingFiles && this.options.node.supportingFiles.length && this.options.node.set("supporting_document_ids", _.map(this.options.node.supportingFiles, function(supportingFile) {
        return supportingFile.get("id");
      }));
    }
  });
});