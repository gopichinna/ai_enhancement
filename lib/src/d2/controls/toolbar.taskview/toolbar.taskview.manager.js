/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "nuc/lib/backbone", "d2/widgets/navigation.header/controls/background.task.notification/background.task.view", "smart/controls/progresspanel/progresspanel", "d2/controls/toolbar.taskview/process.minimize.panel.view", "i18n!d2/controls/toolbar.taskview/impl/nls/lang" ], function(_, Marionette, Backbone, BGTaskView, ProgressPanel, ProcessMinimizePanelView, lang) {
  "use strict";
  var BackgroundTaskManager = Marionette.Object.extend({
    constructor: function BackgroundTaskManager() {
      Marionette.Object.prototype.constructor.apply(this, arguments);
    },
    addTask: function(options) {
      options = options || {};
      var clientId = "MINIMIZE-" + _.uniqueId();
      var collection = new Backbone.Collection();
      var minimizeModel = new Backbone.Model({
        state: "processing",
        doAutoClose: false
      });
      minimizeModel.clientId = clientId;
      minimizeModel.getState = function() {
        return this.get("state");
      };
      options.promise.done(function() {
        minimizeModel.set("state", "resolved");
      }).fail(function() {
        minimizeModel.set("state", "aborted");
      });
      minimizeModel.node = new Backbone.Model();
      collection.add(minimizeModel);
      this.progressPanel = {
        ProgressPanelview: ProcessMinimizePanelView,
        collection: collection,
        enableCancel: true,
        enableMinimiseButton: true,
        doAutoClose: false,
        actionType: clientId,
        jobModel: minimizeModel,
        PendingHeaderTitle: options.PendingHeaderTitle ? options.PendingHeaderTitle : lang.PendingHeaderTitle,
        CompletedHeaderTitle: options.CompletedHeaderTitle ? options.CompletedHeaderTitle : lang.CompletedHeaderTitle,
        ProcessingHeaderTitle: options.ProcessingHeaderTitle ? options.ProcessingHeaderTitle : lang.ProcessingHeaderTitle,
        AbortedHeaderTitle: options.AbortedHeaderTitle ? options.AbortedHeaderTitle : lang.AbortedHeaderTitle
      };
      ProgressPanel.showProgressPanel(collection, this.progressPanel);
      return minimizeModel;
    },
    isToolbarTaskViewRunning: function() {
      return false;
    }
  });
  return new BackgroundTaskManager();
});