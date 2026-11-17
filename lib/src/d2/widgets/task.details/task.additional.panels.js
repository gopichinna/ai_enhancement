/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "d2/widgets/task.details/impl/task.working.files/task.working.files.view", "d2/widgets/task.details/impl/task.supporting.files/task.supporting.files.view", "d2/widgets/task.details/impl/task.notes/task.notes.view", "d2/widgets/metadata/panels/task.performers/metadata.task.performers.view", "d2/widgets/metadata/panels/audit/metadata.audit.view", "i18n!d2/widgets/task.details/impl/nls/lang", "csui-ext!d2/widgets/task.details/task.additional.panels", "d2/sdk/widgets/task.details.panel/task.details.panel.views" ], function(_, Backbone, TaskWorkingFilesView, TaskSupportingFilesView, TaskNotesView, MetadataTaskPerformersTableView, MetadataAuditTableView, lang, extraPanels, sdkPanelsArray) {
  var PanelModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      title: null,
      name: "",
      contentView: null,
      contentViewOptions: null
    },
    constructor: function PanelModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  var PanelCollection = Backbone.Collection.extend({
    model: PanelModel,
    comparator: "sequence",
    constructor: function PanelCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  var taskAdditionalPanels = new PanelCollection([ {
    title: lang.defaultTitleAdditionalPanelWorkingFiles,
    name: "working",
    sequence: 9,
    contentView: TaskWorkingFilesView
  }, {
    title: lang.defaultTitleAdditionalPanelSupportingFiles,
    name: "supporting",
    sequence: 10,
    contentView: TaskSupportingFilesView
  }, {
    title: lang.defaultTitleAdditionalPanelNotes,
    name: "notes",
    sequence: 11,
    contentView: TaskNotesView
  } ]);
  if (extraPanels) {
    taskAdditionalPanels.add(_.flatten(extraPanels, true));
    var counter = 1;
    taskAdditionalPanels.forEach(function(model) {
      if (!model.get("name")) {
        model.set("name", "unnamed_panel" + counter, {
          silent: true
        });
        counter++;
      }
    });
  }
  if (_.isArray(sdkPanelsArray) && sdkPanelsArray.length > 0) {
    sdkPanelsArray.forEach(function(panel) {
      taskAdditionalPanels.add(new PanelModel(panel));
    });
  }
  return taskAdditionalPanels;
});