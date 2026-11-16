/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/dialogs/new.file/o2.processing.view", "i18n!d2/dialogs/add.version/impl/nls/lang" ], function(_, $, Backbone, Marionette, RestLinkrels, constants, O2ProcessingView, lang) {
  "use strict";
  var AddVersionProcessingView = O2ProcessingView.extend({
    className: function() {
      return O2ProcessingView.prototype.className + " d2-add-version-processing";
    },
    constructor: function DowloadFileProcessingView() {
      O2ProcessingView.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {
      return;
    },
    templateHelpers: function() {
      return {
        labelProcessing: lang.FileUploadPending,
        percentage: 0
      };
    },
    onStepActive: function() {
      this.$el.closest(".binf-modal-dialog").find(".binf-modal-header .cs-close").addClass("binf-hidden");
      this.pendingDfd = $.Deferred();
      this.getProcessingPromise().always(this.pendingDfd.resolve).progress(this.updateProgress.bind(this)).done(this.handleProcessingSuccess.bind(this)).fail(this.handleProcessingFailure.bind(this));
      return;
    },
    handleProcessingSuccess: function(fileUploadedSuccessData) {
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingSuccess.bind(this));
      } else {
        this.wizard.close({
          fileUploadedSuccessData: fileUploadedSuccessData
        });
      }
    },
    handleProcessingFailure: function(error) {
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingFailure.bind(this, error));
      } else {
        this.wizard.close({
          fileUploadedFailureData: error
        });
      }
    },
    updateProgress: function(progressData) {
      var percentage = progressData.done / progressData.total * 100;
      this.ui.progressBar.width(percentage + "%");
      this.ui.progressBar.attr("aria-valuenow", percentage);
    },
    getProcessingPromise: function() {
      this.options.file = this.options.fileInfo.file;
      if (!this.options.data) {
        this.options.data = {};
      }
      if (!this.options.data.general && this.options.wizard.data && this.options.wizard.data.general) {
        this.options.data.general = this.options.wizard.data.general;
      }
      if (!this.options.data.properties && this.options.wizard.data && this.options.wizard.data.properties) {
        this.options.data.properties = this.options.wizard.data.properties;
        this.options.data["signoff-inputs"] = this.options.wizard.data["signoff-inputs"];
      }
      return this.options.commandManager.initiateFileUploader(this.options);
    },
    getNextStepId: function() {
      return "finish";
    },
    getMinimizelabels: function() {
      return {
        ProcessingHeaderTitle: _.str.sformat(lang.ProcessingUploadHeaderTitle, this.options.node.get("name")),
        CompletedHeaderTitle: _.str.sformat(lang.CompletedUploadHeaderTitle, this.options.node.get("name"))
      };
    }
  });
  return AddVersionProcessingView;
});