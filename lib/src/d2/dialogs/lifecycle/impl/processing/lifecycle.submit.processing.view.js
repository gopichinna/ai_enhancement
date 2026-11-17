/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/contexts/perspective/perspective.context", "d2/dialogs/new.file/o2.processing.view", "d2/dialogs/mass.update/mass.update.validation.processing/mass.update.validation.processing.view", "i18n!d2/commands/nls/localized.strings", "i18n!d2/dialogs/lifecycle/impl/nls/lang" ], function(_, $, PerspectiveContext, O2ProcessingView, MassUpdateValidationProcessingView, commandLang, lang) {
  "use strict";
  return MassUpdateValidationProcessingView.extend({
    constructor: function LifecycleProcessingView(options) {
      this.bulkLCStateChange = !!options.status.isHomogeneousConfig;
      MassUpdateValidationProcessingView.prototype.constructor.apply(this, arguments);
    },
    getTitle: function() {
      return lang.ProcessingTitle;
    },
    getSubTitle: function() {
      return _.str.sformat(lang.ProcessingSubtitle, this.options.status.nodes.length);
    },
    getTemplate: function() {
      if (this.bulkLCStateChange) {
        return MassUpdateValidationProcessingView.prototype.template;
      } else {
        return O2ProcessingView.prototype.template;
      }
    },
    templateHelpers: function() {
      return {
        labelProcessing: lang.ProcessingLabel,
        percentage: 0
      };
    },
    onStepActive: function() {
      var status = this.options.status, command = this.options.command, targetState = status.data.targetState;
      this.$el.closest(".binf-modal-dialog").find(".binf-modal-header .cs-close").addClass("binf-hidden");
      this.pendingDfd = $.Deferred();
      if (this.bulkLCStateChange) {
        command.performBulkLifeCycleChangeState(status, targetState).always(this.pendingDfd.resolve).done(this.handleProcessingSuccess.bind(this)).fail(this.handleProcessingFailure.bind(this));
      } else {
        command.performMultiFileLifeCycleChangeState(status, targetState).always(this.pendingDfd.resolve).progress(this.updateProgress.bind(this)).done(this.handleProcessingSuccess.bind(this)).fail(this.handleProcessingFailure.bind(this));
      }
    },
    handleProcessingSuccess: function(nextStep) {
      if (this.wizard.isDestroyed) {
        return;
      }
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingSuccess.bind(this, nextStep));
      } else {
        this.options.wizard.close();
      }
    },
    handleProcessingFailure: function() {
      if (this.wizard.isDestroyed) {
        return;
      }
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingFailure.bind(this));
      } else {
        this.options.wizard.close();
      }
    },
    updateProgress: function(progressData) {
      var percentage = progressData.done / progressData.total * 100;
      this.ui.progressBar.width(percentage + "%");
      this.ui.progressBar.attr("aria-valuenow", percentage);
    },
    getMinimizelabels: function() {
      var label = this.options.status.nodes.length === 1 ? "" : "Multiple";
      var value = this.options.status.nodes.length === 1 ? this.options.status.nodes.models[0].get("name") : this.options.status.nodes.length;
      return {
        ProcessingHeaderTitle: _.str.sformat(lang["Processing" + label + "HeaderTitle"], value, this.options.status.actionMenuLabel),
        CompletedHeaderTitle: _.str.sformat(lang["Completed" + label + "HeaderTitle"], value, this.options.status.actionMenuLabel)
      };
    }
  });
});