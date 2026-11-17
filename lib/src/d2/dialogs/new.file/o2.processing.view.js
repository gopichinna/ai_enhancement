/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/utils/taskqueue", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/new.file/node.processing.result.view", "d2/utils/creation.utils", "d2/utils/constants", "i18n!d2/dialogs/new.file/impl/nls/lang", "hbs!d2/dialogs/new.file/impl/o2.processing", "css!d2/dialogs/new.file/impl/o2.processing" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, TaskQueue, ModalAlert, NodeProcessingResultView, creationUtil, constants, lang, template) {
  "use strict";
  var O2ProcessingView = Marionette.ItemView.extend({
    className: "d2-import-file-o2-processing",
    template: template,
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    ui: {
      progressBar: ".o2-progress-bar"
    },
    constructor: function O2ProcessingView(options) {
      options = options || {};
      this.nodeCollection = options.collection;
      this.profileData = options.profileData;
      this.wizard = options.wizard;
      this.parallelism = _.isNumber(options.parallelism) && !_.isNaN(options.parallelism) ? options.parallelism : 1;
      this.minimizeButtonLabel = lang.o2ProcessingMinimizeButtonLabel;
      this.wizardMinimized = false;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.taskQueue = new TaskQueue({
        parallelism: this.parallelism
      });
      this.wizard && this.listenTo(this.wizard, {
        "wizard:minimized": function() {
          this.wizardMinimized = true;
        },
        "wizard:restored": function() {
          this.wizardMinimized = false;
        }
      });
    },
    initialize: function() {
      this.listenTo(this.profileData, "change:profile-value-config-id", function() {
        this.nodeCollection && this.nodeCollection.each(function(nodeModel) {
          creationUtil.clearO2Properties(nodeModel);
        });
      }.bind(this));
    },
    templateHelpers: function() {
      return {
        labelProcessing: lang.o2ProcessingLabel,
        percentage: 0
      };
    },
    updateProgress: function(count, total, subProgress) {
      var percentage = (count / total + (subProgress ? 1 / total * (subProgress.done / subProgress.total) : 0)) * 100;
      this.ui.progressBar.width(percentage + "%");
      this.ui.progressBar.attr("aria-valuenow", percentage);
    },
    onStepBeforeActive: function() {
      this._cancellable = false;
      if (this._isRendered) {
        this.updateProgress(0, 1);
      }
    },
    onStepActive: function() {
      if (this.isProcessingRequired()) {
        var promises, progressCount = 0, totalCount = this.nodeCollection.length, doneFiles = [], failedFiles = [];
        promises = this.nodeCollection.map(function(nodeModel) {
          var deferred = $.Deferred();
          deferred.progress(function(subProgress) {
            this.updateProgress(progressCount, totalCount, subProgress);
          }.bind(this)).always(function() {
            progressCount++;
            this.updateProgress(progressCount, totalCount);
          }.bind(this)).done(function() {
            doneFiles.push(this);
          }.bind(nodeModel)).fail(function() {
            failedFiles.push(this);
          }.bind(nodeModel));
          this.taskQueue.pending.add(this.createTaskForNode(nodeModel, deferred));
          return deferred.promise();
        }.bind(this));
        this.pendingDfd = $.Deferred();
        $.whenAll.apply($, promises).always(this.pendingDfd.resolve).done(this.handleProcessingSuccess.bind(this, doneFiles)).fail(this.handleProcessingFailure.bind(this, failedFiles));
        return;
      }
      this.wizard && this.wizard.nextStep();
    },
    isProcessingRequired: function() {
      return !this.options.wizard.isFileCreationCalledFromIVPublish && this.nodeCollection && this.nodeCollection.length && creationUtil.isO2Enabled(this.profileData);
    },
    createTaskForNode: function(nodeModel, deferred) {
      var me = this;
      return {
        worker: function() {
          if (creationUtil.hasO2Properties(nodeModel) || me.options.mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
            deferred.resolve(nodeModel);
          } else {
            creationUtil.extractO2Properties(nodeModel).progress(deferred.notify).done(deferred.resolve).fail(deferred.reject);
          }
          return deferred.promise();
        }
      };
    },
    handleProcessingSuccess: function(doneFiles) {
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingSuccess.bind(this, doneFiles));
      } else {
        this.gotoNextStep();
      }
    },
    handleProcessingFailure: function(failedFiles) {
      if (this.options.status) {
        this.options.status.failedNodes = failedFiles;
      }
      if (failedFiles.length < this.nodeCollection.length) {
        if (this.wizardMinimized) {
          this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingFailure.bind(this, failedFiles));
          return;
        }
        if (this.options.suppressD2FailMessageSummary) {
          this.abortOnCriticalError();
          return;
        }
        var alertContent = NodeProcessingResultView.create({
          collection: failedFiles,
          type: NodeProcessingResultView.Types.WARNING,
          title: lang.o2ProcessingErrorSomeFailedNodelistTitle
        });
        this.showConfirmationAlert(lang.o2ProcessingErrorSomeFailedAlertTitle, lang.o2ProcessingErrorSomeFailedMessage, lang.o2ProcessingErrorAlertOKButtonLabel, lang.o2ProcessingErrorAlertCancelButtonLabel, alertContent).done(function() {
          this.nodeCollection.remove(failedFiles);
          this.wizard && this.wizard.nextStep();
        }.bind(this)).fail(function() {
          this.abortOnCriticalError();
        }.bind(this));
      } else {
        this.abortOnCriticalError();
        if (this.options.suppressD2FailMessage) {
          return;
        }
        creationUtil.showErrorAlert(lang.o2ProcessingErrorAllFailedTitle, lang.o2ProcessingErrorAllFailedMessage, lang.o2ProcessingErrorAllFailedOKButtonLabel);
      }
    },
    abortOnCriticalError: function() {
      this._cancellable = true;
      this.wizard && this.wizard.cancel();
    },
    gotoNextStep: function() {
      setTimeout(function() {
        this.wizard && this.wizard.nextStep();
      }.bind(this), 500);
    },
    getTitle: function() {
      return lang.o2ProcessingTitle;
    },
    isCancellable: function() {
      return this._cancellable;
    },
    getMinimizelabels: function() {
      var label = this.nodeCollection.length === 1 ? "" : "Multiple";
      var value = this.nodeCollection.length === 1 ? this.nodeCollection.models[0].get("name") : this.nodeCollection.length;
      return {
        ProcessingHeaderTitle: _.str.sformat(lang["Processing" + label + "HeaderTitle"], value),
        CompletedHeaderTitle: _.str.sformat(lang["Completed" + label + "HeaderTitle"], value)
      };
    },
    minimize: function() {
      if (this.wizard && this.pendingDfd) {
        var labels = this.getMinimizelabels();
        this.wizardMinimized = true;
        this.wizard.minimize({
          promise: this.pendingDfd.promise(),
          ProcessingHeaderTitle: labels.ProcessingHeaderTitle,
          CompletedHeaderTitle: labels.CompletedHeaderTitle
        });
      }
    },
    showConfirmationAlert: function(title, message, yesButtonLabel, cancelButtonLabel, contentView) {
      var dfd = $.Deferred(), buttonOptions = {
        showYes: true,
        labelYes: yesButtonLabel,
        labelCancel: cancelButtonLabel,
        showNo: false,
        showCancel: true
      };
      ModalAlert.confirmWarning(function(result) {
        if (result) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }, message, title, {
        buttons: buttonOptions,
        contentView: contentView,
        modalClass: "alert-node-processing-error"
      });
      return dfd.promise();
    }
  });
  return O2ProcessingView;
});