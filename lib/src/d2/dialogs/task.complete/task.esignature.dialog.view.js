/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/task.complete/task.esignature.form.view", "hbs!d2/dialogs/task.complete/impl/task.esignature.dialog", "css!d2/dialogs/task.complete/impl/task.esignature.dialog" ], function(_, $, Backbone, Marionette, NodeTypeIconView, PerfectScrollingBehavior, WizardTabableRegionBehavior, TaskESignatureFormView, template) {
  "use strict";
  return Marionette.LayoutView.extend({
    className: "d2-task-esignature-dialog",
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".d2-task-esignature-dialog-container",
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      formContainer: ".d2-task-esign-form-container"
    },
    ui: {
      iconContainer: ".d2-task-esign-file-icon-container",
      fileContainer: ".d2-task-esign-file-container"
    },
    events: {
      keydown: "onKeyDown"
    },
    templateHelpers: function() {
      return {
        fileName: this.model && this.model.get("name")
      };
    },
    constructor: function TaskESignatureDialogView(options) {
      this.model = options.model;
      this.showFile = !!this.model;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this._setupChildViews();
      this.listenTo(this, "step:active", _.bind(this._setFocus, this));
    },
    _setFocus: function() {
      if (this._isRendered) {
        var control = this.formView.form && this.formView.form.childrenByPropertyId["signoff_login"], fieldView = control && control.fieldView;
        fieldView && fieldView.ui.writeField && fieldView.ui.writeField.trigger("focus");
      } else {
        this.listenTo(this, "step:rendered", _.bind(this._setFocus, this));
      }
    },
    _setupChildViews: function() {
      this._setupFormView();
    },
    _setupFormView: function() {
      this.formView = new TaskESignatureFormView(_.extend(this.options, {
        dialogView: this
      }));
    },
    onShow: function() {
      this._showChildViews();
    },
    _showChildViews: function() {
      this.formContainer.show(this.formView);
      if (this.showFile) {
        this.iconView = new NodeTypeIconView({
          el: this.ui.iconContainer.get(0),
          node: this.model
        });
        this.iconView.render();
      } else {
        this.ui.fileContainer.addClass("binf-hidden");
      }
    },
    getAllFormValues: function() {
      return this.formView.getValues();
    },
    isValid: function() {
      return this.formView.isValidForm();
    },
    onKeyDown: function(event) {
      if (event.which === 13 && this.formView.$form.has(event.target).length) {
        if (!this.options.wizard.blockingParentView || this.options.wizard.blockingParentView && this.options.wizard.blockingParentView._blockingCounter < 1) {
          this._executeEnter();
        }
      }
    },
    _executeEnter: _.throttle(function() {
      if (this.options.wizard && this.options.wizard.footerView) {
        var nextButton = this.options.wizard.footerView.$el.find(".btn-primary");
        !nextButton.prop("disabled") && setTimeout(function() {
          nextButton.trigger("click");
        });
      }
    }, 100, {
      trailing: false
    })
  });
});