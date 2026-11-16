/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/dialogs/zipanddownload/zip.download.utils", "d2/widgets/virtual.document/virtual.document.view", "csui/widgets/search.results/search.results.view", "i18n!d2/dialogs/zipanddownload/impl/nls/lang" ], function(require, _, $, Url, GlobalMessage, ModalAlert, constants, RestLinkrels, RestResources, utils, ZipDownloadUtils, VirtualDocumentView, SearchResultsView, lang) {
  "use strict";
  function ZipDownloadDialog(options) {
    options || (options = {});
    this.options = options;
  }
  _.extend(ZipDownloadDialog.prototype, {
    STEPS: Object.freeze({
      ZIP_VALIDATION: "zip_validation"
    }),
    _getActionLabel: function() {
      return lang.ZipDefaultLabel;
    },
    _evaluateNextLabel: function() {
      return lang.ZipSubmitStepLabel;
    },
    _evaluateNextStep: function(options) {
      this.submitForm(options);
    },
    submitForm: function(options) {
      options.context = options.context ? options.context : this.options.status.context;
      this.wizard.close(options);
    },
    _createSteps: function(viewClasses) {
      var step, me = this;
      var folderlength = this.options.status.nodes.filter(function(node) {
        return _.contains([ constants.Types.FOLDER ], node.get("type"));
      }).length;
      var stepOptions = {
        steps: [],
        usePreviousStepTitleAsBackButtonTooltip: false,
        className: "d2-zip-wizard"
      };
      step = {
        id: me.STEPS.ZIP_VALIDATION,
        viewClass: viewClasses.ZipDownloadDialogView,
        viewOptions: {
          defaultName: this.options.defaultName,
          folderLength: folderlength,
          status: this.options.status,
          dialog: this
        },
        title: me._getActionLabel(),
        buttons: [ {
          id: "next",
          disabled: function() {
            return !this.isValid();
          },
          label: function() {
            return me._evaluateNextLabel();
          },
          hidden: function() {
            return !this.isValid();
          },
          clickHandler: function() {
            me._evaluateNextStep(this._getSubmitOptions());
          }
        }, {
          id: "minimize_wizard",
          isPrimary: true,
          label: function() {
            return lang.ZipMinimizeStepLabel;
          },
          disabled: function() {
            return !this.isMinimizable();
          },
          hidden: function() {
            return !this.isMinimizable();
          },
          clickHandler: function() {
            this.minimize();
          }
        } ],
        onCancel: function() {
          return me.onCancel();
        }
      };
      stepOptions.steps.push(step);
      return stepOptions;
    },
    show: function() {
      var deferred = $.Deferred(), me = this;
      var deps = [ "d2/controls/stepper.wizard/stepper.wizard.view", "d2/dialogs/zipanddownload/zip.validation.dialog.view" ];
      require(deps, function(StepperWizard, ZipDownloadDialogView) {
        var viewClasses = {
          ZipDownloadDialogView: ZipDownloadDialogView
        }, stepOptions = me._createSteps(viewClasses);
        me.wizard = new StepperWizard(stepOptions);
        me.wizard.show();
        me.wizard.on("wizard:closed", function(cancel, result) {
          if (cancel || !(cancel || result)) {
            deferred.reject("cancel");
          } else if (result) {
            me.intiateDownload(result).done(function(data) {
              deferred.resolve(data);
            }).fail(deferred.reject);
          }
        });
        me.wizard.once("wizard:minimized", function() {
          me.options.commandOptions && me.options.commandOptions.commandPromise && me.options.commandOptions.commandPromise.resolve();
        });
      }, deferred.reject);
      return deferred.promise();
    },
    onCancel: function() {
      var deferred = $.Deferred(), buttonOptions = {
        labelYes: lang.TaskCompleteStopLabel,
        showNo: false,
        showCancel: true
      };
      ModalAlert.confirmQuestion(function(result) {
        if (result) {
          deferred.resolve();
        } else {
          deferred.reject();
        }
      }, lang.ZipCancelConfirmMessage, lang.ZipCancelConfirmTitle, {
        buttons: buttonOptions
      });
      return deferred.promise();
    },
    getValidationUrl: function() {
      return RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_ZIP_DOWNLOAD_VALIDATION);
    },
    validateZipDownloadObjects: function(options) {
      options.context = this.options && this.options.status && this.options.status.context;
      return ZipDownloadUtils.validateZipDownloadObjects(options, this.options.status.nodes);
    },
    intiateDownload: function(options) {
      options["actionType"] = "d2_zip_and_download";
      if (this.options.c2Override === undefined) {
        this.options.c2Override = false;
      }
      options["c2_override"] = this.options.c2Override;
      var collection = this.options.status.originatingView.collection;
      if (!this.options.status.originatingView.collection) {
        if (status.originatingView instanceof VirtualDocumentView) {
          collection = this.options.status.originatingView.explorerView.collection;
        }
      }
      var widgetOptions = ZipDownloadUtils._getWidgetOptions(collection);
      options["widget_name"] = widgetOptions.widget_name;
      options["widget_type"] = widgetOptions.widget_type;
      var deferred = $.Deferred();
      if (this.options.status.originatingView instanceof SearchResultsView) {
        ZipDownloadUtils.getColumnInformation(options, this.options.status);
      }
      ZipDownloadUtils.initateZipDownload(options, this.options.status.nodes).done(function() {
        deferred.resolve({
          widgetName: options["widget_name"],
          widgetType: options["widget_type"]
        });
      }).fail(deferred.reject);
      return deferred.promise();
    }
  });
  return ZipDownloadDialog;
});