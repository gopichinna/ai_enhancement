/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/models/form", "csui/dialogs/modal.alert/modal.alert", "csui/dialogs/file.open/file.open.dialog", "d2/dialogs/add.version/file.uploader", "d2/dialogs/add.version/add.version.utils", "d2/dialogs/add.version/add.version.general.view", "d2/dialogs/add.version/add.version.propertypage.view", "d2/dialogs/add.version/add.version.processing.view", "d2/controls/stepper.wizard/stepper.wizard.view", "i18n!d2/dialogs/add.version/impl/nls/lang" ], function(module, _, $, Backbone, Marionette, FormModel, AlertDialog, FileOpenDialog, FileUploader, AddVersionUtils, AddVersionGeneralView, AddVersionPropertyPageView, AddVersionProcessingView, StepperWizard, lang) {
  "use strict";
  function AddVersionDialog(options) {
    options || (options = {});
    this.options = options;
  }
  _.extend(AddVersionDialog.prototype, {
    show: function() {
      return this.showWizard();
    },
    showWizard: function() {
      var deferred = $.Deferred(), wizard = this._getWizard();
      wizard.show().on("wizard:closed", function(isCancel, fileUploaderOption) {
        if (!isCancel) {
          if (fileUploaderOption.fileUploadedSuccessData) {
            deferred.resolve(fileUploaderOption.fileUploadedSuccessData);
          } else if (fileUploaderOption.fileUploadedFailureData) {
            deferred.reject(fileUploaderOption.fileUploadedFailureData);
          } else {
            fileUploaderOption.file = fileUploaderOption.fileInfo.file;
            this.options.commandManager.initiateFileUploader(fileUploaderOption).done(deferred.resolve).fail(deferred.reject);
          }
        }
      }.bind(this));
      return deferred.promise();
    },
    _launchConfirmationDialog: function() {
      var me = this;
      var dfd = $.Deferred();
      AlertDialog.confirmQuestion(function(result) {
        if (result) {
          dfd.resolve();
          me.options.refresh(false);
          me.options.cancelCheckout();
        } else {
          dfd.reject();
        }
      }, lang.ConfirmationText, lang.ConfirmationTitle, {
        buttons: {
          showYes: true,
          labelYes: lang.Stop,
          showNo: false,
          showCancel: true
        }
      });
      return dfd.promise();
    },
    _createWizardSteps: function(hasGeneralPage, hasPropertyPage, hasProcessingStep) {
      var addVersionGeneralStep = {
        id: "addversiongeneral",
        title: lang.GeneralPageTitle,
        viewClass: AddVersionGeneralView,
        viewOptions: this.options,
        onCancel: this._launchConfirmationDialog,
        buttons: [ {
          id: "next",
          label: hasPropertyPage ? lang.Next : lang.AddVersion,
          disabled: function() {
            return !this.isValidForm();
          },
          clickHandler: function() {
            this.next();
          }
        } ]
      }, addVersionPropertiesPageStep = {
        id: "addversionproperty",
        title: lang.PropertyPageTitle,
        viewClass: AddVersionPropertyPageView,
        viewOptions: this.options,
        onCancel: this._launchConfirmationDialog,
        buttons: [ {
          id: "next",
          label: lang.AddVersion,
          disabled: function() {
            return !this.isValidForm();
          },
          clickHandler: function() {
            this.next();
          }
        } ]
      }, addVersionProcessingStep = {
        id: "addversionprocessing",
        title: lang.UploadingStepTitle,
        viewClass: AddVersionProcessingView,
        viewOptions: this.options,
        buttons: [ {
          id: "previous",
          hidden: true
        }, {
          id: "cancel",
          hidden: true
        }, {
          id: "next",
          hidden: true
        } ]
      };
      var steparr = [];
      if (hasGeneralPage) {
        steparr.push(addVersionGeneralStep);
      }
      if (hasPropertyPage) {
        steparr.push(addVersionPropertiesPageStep);
      }
      if (hasProcessingStep) {
        steparr.push(addVersionProcessingStep);
      }
      return steparr;
    },
    _getWizard: function() {
      var hasPropertyPage = this.options.config.properties["property_page"];
      var silent = this.options.config.properties["silent_checkin"];
      var hasGeneralPage = silent && this.options.config.properties["can_log_entry"] || !silent;
      var hasProcessingStep = this.options.showProcessingStep === true;
      this._steps = this._createWizardSteps(hasGeneralPage, hasPropertyPage, hasProcessingStep);
      return new StepperWizard({
        steps: this._steps,
        className: "d2-addversion-modal",
        data: {}
      });
    }
  });
  return AddVersionDialog;
});