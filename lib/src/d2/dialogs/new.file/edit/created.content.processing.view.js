/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/ctf/constants", "d2/dialogs/new.file/o2.processing.view", "d2/ctf/ctfBridge", "i18n!d2/dialogs/new.file/edit/impl/nls/lang" ], function(_, $, Backbone, Marionette, RestLinkrels, constants, ctfConstants, O2ProcessingView, ctfBridge, lang) {
  "use strict";
  var DowloadFileProcessingView = O2ProcessingView.extend({
    className: function() {
      return O2ProcessingView.prototype.className + " d2-create-download-processing";
    },
    constructor: function DowloadFileProcessingView() {
      O2ProcessingView.prototype.constructor.apply(this, arguments);
    },
    getTitle: function() {
      return this.options.mode === "UPLOAD" ? lang.UploadingStepTitle : lang.DownloadingStepTitle;
    },
    initialize: function() {
      return;
    },
    isProcessingRequired: function() {
      return true;
    },
    templateHelpers: function() {
      return {
        labelProcessing: this.options.mode === "UPLOAD" ? lang.UploadingLabel : lang.DownloadingLabel,
        percentage: 0
      };
    },
    onStepActive: function() {
      if (this.isProcessingRequired()) {
        if (this.options.mode === "UPLOAD") {
          this.$el.closest(".binf-modal-dialog").find(".binf-modal-header .cs-close").addClass("binf-hidden");
        }
        this.pendingDfd = $.Deferred();
        var node = this.options.node;
        this.getProcessingPromise(node).always(this.pendingDfd.resolve).progress(this.updateProgress.bind(this)).done(this.handleProcessingSuccess.bind(this)).fail(this.handleProcessingFailure.bind(this));
        return;
      }
      this.wizard && this.wizard.nextStep();
    },
    handleProcessingSuccess: function() {
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingSuccess.bind(this));
      } else {
        this.gotoNextStep();
      }
    },
    handleProcessingFailure: function(error) {
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingFailure.bind(this, error));
      } else {
        this.options.checkinData["downloadError"] = error;
        this.gotoNextStep();
      }
    },
    updateProgress: function(progressData) {
      var percentage = progressData.done / progressData.total * 100;
      this.ui.progressBar.width(percentage + "%");
      this.ui.progressBar.attr("aria-valuenow", percentage);
    },
    getProcessingPromise: function(node) {
      if (this.options.mode === "UPLOAD") {
        var fileUploaderOptions = this.options.wizard.data.checkinData.fileUploaderOptions;
        return this.options.action.uploadContentUsingFileUploader(node, fileUploaderOptions);
      } else {
        return this.downloadCreatedContentUsingWsctf(node);
      }
    },
    downloadCreatedContentUsingWsctf: function(node) {
      var deferred = $.Deferred(), dlHelper = this.options.downloadHelper, downloadLink = dlHelper.getDownloadLink(node);
      if (downloadLink) {
        dlHelper.fetchDownloadUrls(node, downloadLink).done(function(urls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath) {
          dlHelper._performDownloadUsingWsCtf(urls, node, ctfConstants.OpType.CHECKOUT, ctfConstants.Mode.EDIT, true, true, true, downloadLocationPath.checkout).progress(deferred.notify).done(deferred.resolve).fail(deferred.reject);
        }).fail(deferred.reject);
      } else {
        this.gotoNextStep();
        deferred.resolve();
      }
      return deferred.promise();
    },
    getNextStepId: function() {
      return "finish";
    },
    getMinimizelabels: function() {
      return {
        ProcessingHeaderTitle: _.str.sformat(this.options.mode === "UPLOAD" ? lang.ProcessingUploadHeaderTitle : lang.ProcessingDownloadHeaderTitle, this.options.node.get("name")),
        CompletedHeaderTitle: _.str.sformat(this.options.mode === "UPLOAD" ? lang.CompletedDownloadHeaderTitle : lang.CompletedDownloadHeaderTitle, this.options.node.get("name"))
      };
    }
  });
  return DowloadFileProcessingView;
});