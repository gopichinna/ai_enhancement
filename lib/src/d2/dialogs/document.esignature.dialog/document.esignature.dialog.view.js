/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/node-type.icon/node-type.icon.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/controls/behaviors/wizard.tabable.region.behavior", "d2/dialogs/document.esignature.dialog/document.esignature.form.view", "hbs!d2/dialogs/document.esignature.dialog/impl/document.esignature.dialog", "i18n!d2/dialogs/lifecycle/impl/nls/lang", "css!d2/dialogs/document.esignature.dialog/impl/document.esignature.dialog" ], function(_, $, Backbone, Marionette, NodeTypeIconView, PerfectScrollingBehavior, WizardTabableRegionBehavior, TaskESignatureFormView, template, lang) {
  "use strict";
  var DocumentESignatureDialogView = Marionette.LayoutView.extend({
    className: "document-esignature-dialog",
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".document-esignature-dialog-container",
        suppressScrollX: true
      },
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    regions: {
      formContainer: ".document-esign-form-container"
    },
    ui: {
      iconContainer: ".document-esign-file-icon-container",
      fileContainer: ".document-esign-file-container"
    },
    events: {
      keydown: "onKeyDown"
    },
    templateHelpers: function() {
      return {
        fileName: this.model && this.model.get("name")
      };
    },
    constructor: function DocumentESignatureDialogView(options) {
      this.model = options.model;
      this.currentNode = options.node;
      this.showFile = !!this.model;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.validUser = true;
      this._setupChildViews();
      this.listenTo(this, "step:active", _.bind(this._setFocus, this));
      this.listenTo(this.formView, "d2:change:form:field", _.bind(this._changeFormFieldAndRefireEvent, this));
      this.listenTo(this.formView, "d2:change:formValidation", _.bind(this._validateFormFieldEvent, this));
    },
    _validateFormFieldEvent: function() {
      this.validUser = true;
      this.triggerMethod("d2:metadata:formValidation");
    },
    _changeFormFieldAndRefireEvent: function() {
      this.validUser = true;
      this.triggerMethod("d2:metadata:formFieldChange");
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
    getTitle: function() {
      return lang.D2LifecycleESignTitle;
    },
    getItemModel: function() {
      return this.currentNode;
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
      return this.validUser && this.formView.isValidForm();
    },
    onKeyDown: function(event) {
      if ((event.which === 13 || event.which === 8) && this.formView.$form.has(event.target).length) {
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
  return DocumentESignatureDialogView;
});