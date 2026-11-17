/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/utils/taskqueue", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "d2/utils/creation.utils", "d2/dialogs/new.file/o2.processing.view", "i18n!d2/dialogs/new.file/impl/nls/lang", "css!d2/dialogs/new.file/impl/o2.processing" ], function(_, $, Backbone, Marionette, PerfectScrollingBehavior, TaskQueue, CommandHelper, RestLinkrels, creationUtil, O2ProcessingView, lang) {
  "use strict";
  var UploadFolderProcessingView = O2ProcessingView.extend({
    className: function() {
      return O2ProcessingView.prototype.className + " d2-import-folder-upload-processing";
    },
    constructor: function UploadProcessingView(options) {
      O2ProcessingView.prototype.constructor.apply(this, arguments);
      this.nodeCollection = options.status.folderUploadModels;
    },
    getTitle: function() {
      return lang.processingTitle;
    },
    initialize: function() {
      return;
    },
    isProcessingRequired: function() {
      return true;
    },
    onStepActive: function() {
      var me = this;
      if (this.isProcessingRequired()) {
        var promises, totalCount = this.nodeCollection.at(0).get("total");
        promises = this.nodeCollection.map(function(nodeModel) {
          var deferred = me.options.command._performAction(nodeModel, this.taskQueue, this.options.status);
          deferred.progress(function(subProgress) {
            this.updateProgress(subProgress, totalCount);
          }.bind(this));
          return deferred;
        }.bind(this));
        this.pendingDfd = $.Deferred();
        $.whenAll.apply($, promises).always(this.pendingDfd.resolve).then(this.calculateVdocSteps.bind(this)).done(this.handleProcessingSuccess.bind(this)).fail(this.handleProcessingFailure.bind(this));
        return;
      }
      this.wizard && this.wizard.nextStep();
    },
    updateProgress: function(count, total) {
      var percentage = count / total * 100;
      this.ui.progressBar.width(percentage + "%");
      this.ui.progressBar.attr("aria-valuenow", percentage);
    },
    calculateVdocSteps: function() {
      if (this.options.profileData.folderSelectionModel.get("properties")["convert_to_vd"]) {
        return this.options.wizardView.calculateApplicableStepsForVdocConversion();
      } else {
        return $.Deferred().resolve().promise();
      }
    },
    handleProcessingSuccess: function() {
      this.nodeCollection.first().set({
        state: "resolved"
      });
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingSuccess.bind(this));
      } else {
        this.gotoNextStep();
      }
    },
    handleProcessingFailure: function() {
      this.nodeCollection.first().set({
        state: "rejected"
      });
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingFailure.bind(this));
      } else {
        this.wizard.close();
      }
    },
    getMinimizelabels: function() {
      return {
        ProcessingHeaderTitle: _.str.sformat(lang.ProcessingHeaderTitleFolderImport, this.options.node.get("rootFolderName")),
        CompletedHeaderTitle: _.str.sformat(lang.CompletedHeaderTitleFolderImport, this.options.node.get("rootFolderName"))
      };
    }
  });
  return UploadFolderProcessingView;
});