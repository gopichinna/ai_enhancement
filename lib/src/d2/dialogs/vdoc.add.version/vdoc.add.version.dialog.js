/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/models/form", "csui/dialogs/modal.alert/modal.alert", "csui/dialogs/file.open/file.open.dialog", "d2/dialogs/add.version/add.version.general.view", "d2/dialogs/add.version/add.version.propertypage.view", "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/add.version/file.uploader", "d2/dialogs/add.version/add.version.utils", "i18n!d2/dialogs/add.version/impl/nls/lang" ], function(module, _, $, Backbone, Marionette, FormModel, AlertDialog, FileOpenDialog, AddVersionGeneralView, AddVersionPropertyPageView, StepperWizard, FileUploader, AddVersionUtils, lang) {
  "use strict";
  var wizardDataObject = {}, wizardData = [];
  function VdocaddVersionDialog(fileConfigdata, options) {
    options || (options = {});
    this.options = options;
    this.fileConfigdata = fileConfigdata;
  }
  _.extend(VdocaddVersionDialog.prototype, {
    show: function(isSilentCheckin) {
      this._deferred = $.Deferred();
      this.isSilentCheckin = isSilentCheckin;
      this.wizard = this._getWizard();
      this.wizard.show();
      return this._deferred.promise();
    },
    _launchConfirmationDialog: function() {
      var dfd = $.Deferred();
      AlertDialog.confirmQuestion(function(result) {
        if (result) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }, lang.ConfirmationTextforMultiple, lang.ConfirmationTitle, {
        buttons: {
          showYes: true,
          labelYes: lang.Stop,
          showNo: false,
          showCancel: true
        }
      });
      return dfd.promise();
    },
    _createWizardSteps: function() {
      var steparr = [], me = this, stepsRequireUserInteraction = [];
      wizardData = [];
      _.each(this.fileConfigdata, function(eachNodeData) {
        eachNodeData.context = me.options.context;
        if (eachNodeData.checkin_from_file_mandatory || !me.isSilentCheckin) {
          stepsRequireUserInteraction.push(eachNodeData);
        }
      });
      if (stepsRequireUserInteraction.length) {
        _.each(stepsRequireUserInteraction, function(eachStepData, index) {
          eachStepData.deferred = me._deferred;
          var silent = eachStepData.config.properties["silent_checkin"];
          var includeGeneralPage = silent && eachStepData.config.properties["can_log_entry"] || !silent;
          if (includeGeneralPage || eachStepData.checkin_from_file_mandatory) {
            steparr.push({
              id: "addversiongeneral_" + index,
              title: lang.GeneralPageTitle,
              subTitle: _.str.sformat(lang.SubTitle, index + 1, stepsRequireUserInteraction.length),
              viewClass: AddVersionGeneralView,
              viewOptions: eachStepData,
              onCancel: me._launchConfirmationDialog,
              buttons: [ {
                id: "next",
                label: eachStepData.config.properties["property_page"] ? lang.Continue : lang.NextFileLabel,
                disabled: function() {
                  return !this.isValidForm();
                },
                clickHandler: function() {
                  me.storeGeneralData(this);
                }
              } ]
            });
          }
          if (eachStepData.config.properties["property_page"]) {
            steparr.push({
              id: "addversionproperty_" + index,
              title: lang.PropertyPageTitle,
              subTitle: _.str.sformat(lang.SubTitle, index + 1, stepsRequireUserInteraction.length),
              viewClass: AddVersionPropertyPageView,
              viewOptions: eachStepData,
              onCancel: me._launchConfirmationDialog,
              buttons: [ {
                id: "next",
                label: lang.NextFileLabel,
                disabled: function(args) {
                  return !this.isValidForm(args);
                },
                clickHandler: function() {
                  me.storePropertiesData(this);
                }
              } ]
            });
          }
        });
        if (steparr.length) {
          _.last(steparr).buttons[0].label = lang.AddVersion;
          _.last(steparr).buttons[0].clickHandler = function() {
            me.uploadFiles(this).done(function(results) {
              me._deferred.resolve(results);
            }).fail(function(errorDetails) {
              me._deferred.reject(errorDetails);
            });
          };
          return steparr;
        } else {
          me._deferred.resolve();
        }
      } else {
        var fileuploader = new FileUploader(this.fileConfigdata);
        this.options.progressMessage(this.fileConfigdata);
        if (!_.first(this.fileConfigdata)["ctfEnabled"]) {
          return fileuploader.uploadFiles();
        } else {
          return fileuploader.uploadFilesUsingCtf();
        }
      }
    },
    storeGeneralData: function(view) {
      var dfd = $.Deferred();
      if (view.options.config.properties["property_page"]) {
        view.next().done(() => {
          this.wizard.nextStep();
          dfd.resolve();
        }).fail(dfd.reject);
      } else {
        view.next().done(() => {
          this.stepdata = this._clone(view.options);
          wizardDataObject[this.wizard.currentStep] = this.stepdata;
          this.wizard.nextStep();
          dfd.resolve();
        }).fail(dfd.reject);
      }
      return dfd.promise();
    },
    storePropertiesData: function(view) {
      var dfd = $.Deferred();
      view.next().done(() => {
        this.stepdata = this._clone(view.options);
        wizardDataObject[this.wizard.currentStep] = this.stepdata;
        this.wizard.nextStep();
        dfd.resolve();
      }).fail(dfd.reject);
      return dfd.promise();
    },
    uploadFiles: function(view) {
      var me = this, dfd = $.Deferred(), dataUpdatePromise;
      if (view.options.config.properties["property_page"]) {
        dataUpdatePromise = this.storePropertiesData(view);
      } else {
        dataUpdatePromise = this.storeGeneralData(view);
      }
      dataUpdatePromise.done(() => {
        wizardData = _.values(wizardDataObject);
        _.each(this.fileConfigdata, function(fileConfig, index) {
          _.each(wizardData, function(wizardNodedata) {
            if (fileConfig.id === wizardNodedata.node.get("id")) {
              me.fileConfigdata[index] = wizardNodedata;
            }
          });
        });
        var fileuploader = new FileUploader(this.fileConfigdata);
        this.options.progressMessage(this.fileConfigdata);
        this.wizard.close();
        if (!view.options.ctfEnabled) {
          return fileuploader.uploadFiles().done(dfd.resolve).fail(dfd.reject);
        } else {
          return fileuploader.uploadFilesUsingCtf().done(dfd.resolve).fail(dfd.reject);
        }
      });
      return dfd.promise();
    },
    _clone: function(options) {
      return {
        data: _.clone(options.data),
        fileInfo: options.fileInfo,
        file: options.fileInfo.file,
        config: options.config,
        node: options.node,
        checkinurl: options.checkinurl,
        view: options.view,
        isMultipleCheckin: true
      };
    },
    _getWizard: function() {
      this._steps = this._createWizardSteps();
      return new StepperWizard({
        steps: this._steps,
        className: "d2-addversion-modal",
        data: {}
      });
    }
  });
  return VdocaddVersionDialog;
});