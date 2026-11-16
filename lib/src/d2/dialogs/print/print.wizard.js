/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/dialogs/print/print.view", "csui/controls/wizard/wizard.view", "d2/widgets/metadata/utils/form.converter", "csui/models/form", "csui/controls/progressblocker/blocker", "i18n!d2/dialogs/print/impl/nls/lang" ], function(module, _, $, Backbone, Marionette, PrintView, WizardView, MetadataConverter, FormModel, BlockingView, lang) {
  "use strict";
  function PrintWizard(options) {
    options || (options = {});
    this.options = options;
    this.printForm = MetadataConverter.convertConfig(this.options.content.dialog_content, {
      actionMode: "create"
    }).propertiesConfig[0];
  }
  _.extend(PrintWizard.prototype, {
    show: function() {
      this._showWizard();
      this._deferred = $.Deferred();
      return this._deferred.promise();
    },
    _showWizard: function() {
      this._steps = this._createWizardSteps();
      this._wizard = new WizardView({
        steps: this._steps
      });
      BlockingView.imbue(this._wizard);
      this._wizard.show(this._wizard.options);
      this.printView = this._steps[0].view;
      this.printView.on("change:field", this.updateButton, this);
      this.printView.on("invalid:field", this.updateButton, this);
      this.printView.on("keydown:field", this.updateButton, this);
    },
    updateButton: function(event, args) {
      var isValid = _.map(this.printView.$el.alpaca("get").children, function(child) {
        if (!!args && _.isMatch(child, args.field)) {
          return !_.isEmpty(args.val) && child.validate();
        } else {
          return !_.isEmpty(child.data) && child.validate();
        }
      });
      var bValid = !_.contains(isValid, false) ? true : false;
      var buttonView = this._wizard.currentView.footerView.children._views;
      _.each(buttonView, function(print) {
        if (print.model.get("id") === "print") {
          bValid ? print.$el.removeAttr("disabled") : print.$el.attr("disabled", "disabled");
        }
      }, this);
    },
    onClickFinishButton: function() {
      this._wizard.destroy();
      var controlledInputValues = _.map(this.printView.$el.find("input"), function(input) {
        return input.value;
      });
      var controlledInput = _.object(_.keys(this.printForm.data), controlledInputValues);
      if (this._deferred) {
        if (controlledInput) {
          this._deferred.resolve(controlledInput);
        }
      }
    },
    onHideDialog: function() {
      this._wizard.destroy();
      if (this._deferred && this._deferred.state() === "pending") {
        this._deferred.reject({
          cancelled: true
        });
      }
    },
    dialogClassName: function() {
      var className = "d2-print-wizard";
      if (this.options && this.options.userClassName) {
        className = className + " " + this.options.userClassName;
      }
      return className;
    },
    _createPrintView: function() {
      var options = this.options;
      options.model = new FormModel(this.printForm);
      var step1view = new PrintView(options);
      return step1view;
    },
    _createWizardSteps: function() {
      var step1view = this._createPrintView();
      var dialogButton = [ {
        id: "print",
        label: lang.PrintButtonLabel,
        default: true,
        doneButton: true,
        disabled: true,
        close: true,
        click: _.bind(this.onClickFinishButton, this)
      }, {
        id: "cancel",
        label: lang.CancelButtonLabel,
        close: true,
        click: _.bind(this.onHideDialog, this)
      } ];
      var step1 = {
        title: lang.PrintButtonLabel,
        view: step1view,
        className: this.dialogClassName() + " d2-print-modal",
        userClassName: "d2-print-modal",
        buttons: dialogButton
      };
      return [ step1 ];
    }
  });
  return PrintWizard;
});