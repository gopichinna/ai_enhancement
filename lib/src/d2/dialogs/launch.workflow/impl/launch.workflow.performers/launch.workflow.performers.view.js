/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "nuc/utils/url", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/launch.workflow/impl/launch.workflow.general/launch.workflow.general.view", "d2/dialogs/task.update.performers/task.update.performer.view", "d2/utils/rest.linkrels", "d2/utils/task.utils", "dctmw/utils/utils", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.performers/launch.workflow.performers", "css!d2/dialogs/launch.workflow/impl/launch.workflow.performers/launch.workflow.performers" ], function($, _, Marionette, PerfectScrollingBehavior, Url, WizardTabableRegionBehavior, LaunchWorkflowGeneralView, TaskUpdatePerformerView, RestLinkrels, taskUtils, utils, template) {
  "use strict";
  var WorkflowPerformerView = TaskUpdatePerformerView.extend({
    onFormFieldValidate: function() {
      var dfd = $.Deferred();
      TaskUpdatePerformerView.prototype.onFormFieldValidate.apply(this, arguments).always(_.bind(function() {
        this.options.wizard && this.options.wizard.refreshHeader();
      }, this)).done(dfd.resolve).fail(dfd.reject);
      return dfd.promise();
    }
  });
  return LaunchWorkflowGeneralView.extend({
    className: "d2-launch-workflow-performers-dialog",
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-launch-workflow-performers-dialog-container",
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      formContainer: ".d2-launch-workflow-performers-form-container"
    },
    constructor: function LaunchWorkflowPerformersDialogView(options) {
      options.task = options.node;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this._setupChildViews();
    },
    _setupFormView: function() {
      this.formView = new WorkflowPerformerView(_.extend(this.options, {
        dialogView: this,
        ignoreFormChange: true,
        supressBehavior: true
      }));
      this.listenTo(this.formView, "render:form", function() {
        this.triggerMethod("step:rendered");
      });
    },
    onRender: function() {
      if (utils.isMobile()) {
        this.$el.addClass("d2mobile-properties-wrapper");
        this.$el.find(".d2-launch-workflow-performers-form-container").addClass("d2mobile-tabpanel d2mobile-tabpanel-edit task-update-performer-container");
      }
      LaunchWorkflowGeneralView.prototype.onRender && LaunchWorkflowGeneralView.prototype.onRender.apply(this, arguments);
    },
    render: function() {
      Marionette.LayoutView.prototype.render.apply(this, arguments);
      this.formView.render();
    },
    updateModelData: function() {
      var formValueMap = this.formView.getFormValueMap();
      this.options.node.set("performer_aliases", taskUtils.getPerformerAliasesData({
        data: formValueMap
      }).performer_aliases);
    },
    validatePerformers: function(options) {
      return this.formView.onFormFieldValidate(options);
    }
  });
});