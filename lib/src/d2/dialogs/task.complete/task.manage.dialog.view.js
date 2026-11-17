/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/task.complete/next.tasks.form.view", "d2/dialogs/task.complete/task.manage.tab.panels.view", "hbs!d2/dialogs/task.complete/impl/task.manage.dialog", "css!d2/dialogs/task.complete/impl/task.manage.dialog" ], function(_, Marionette, WizardTabableRegionBehavior, NextTasksFormView, TaskManageTabPanelsView, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-task-manage-dialog",
    template: template,
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      tabContainer: ".d2-task-manage-dialog-tabs-container"
    },
    constructor: function TaskManageDialogView(options) {
      options = options || {};
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.showPerformersTab = this.options.showTaskPerformers;
      this._setupChildView();
    },
    _setupChildView: function() {
      var options = _.extend(this.options, {
        dialogView: this,
        showPerformersTab: this.showPerformersTab
      });
      this.tabView = new TaskManageTabPanelsView(options);
    },
    onShow: function() {
      this.tabContainer.show(this.tabView);
    },
    getAllFormValues: function() {
      return this.tabView.getAllValues();
    },
    validateAllTabs: function() {
      return this.tabView.validateAllTabs();
    },
    isValid: function() {
      return this.tabView.isValid();
    }
  });
});