/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/launch.workflow/impl/launch.workflow.general/launch.workflow.general.form.view", "dctmw/utils/utils", "hbs!d2/dialogs/launch.workflow/impl/launch.workflow.general/launch.workflow.general", "css!d2/dialogs/launch.workflow/impl/launch.workflow.general/launch.workflow.general" ], function($, _, Marionette, PerfectScrollingBehavior, WizardTabableRegionBehavior, LaunchWorkflowGeneralFormView, utils, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-launch-workflow-general-dialog",
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-launch-workflow-general-dialog-container",
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      formContainer: ".d2-launch-workflow-general-form-container"
    },
    constructor: function LaunchWorkflowGeneralDialogView(options) {
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this._setupChildViews();
    },
    _setupChildViews: function() {
      this._setupFormView();
    },
    _setupFormView: function() {
      this.formView = new LaunchWorkflowGeneralFormView(_.extend(this.options, {
        dialogView: this
      }));
      this.listenTo(this.formView, "render:form", function() {
        this.triggerMethod("step:rendered");
      });
      if (utils.isMobile()) {
        this.$el.addClass("d2mobile-properties-wrapper");
      }
    },
    onShow: function() {
      this._showChildViews();
    },
    _showChildViews: function() {
      var options = {};
      if (this.formView.isRenderFinished()) {
        options.render = false;
      }
      this.formContainer.show(this.formView, options);
    },
    isValid: function() {
      return this.formView && this.formView.isValidForm();
    },
    updateModelData: function() {
      var values = this.formView.getValues();
      this.options.node.set("workflow_name", $.trim(values.workflow_name));
      this.options.node.set("workflow_note", $.trim(values.workflow_note));
    }
  });
});