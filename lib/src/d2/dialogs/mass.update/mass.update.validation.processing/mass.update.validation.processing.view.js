/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/contexts/perspective/perspective.context", "d2/dialogs/new.file/o2.processing.view", "i18n!d2/dialogs/mass.update/impl/nls/lang", "hbs!d2/dialogs/mass.update/mass.update.validation.processing/impl/mass.update.validation.processing", "css!d2/dialogs/mass.update/mass.update.validation.processing/impl/mass.update.validation.processing" ], function(_, $, PerspectiveContext, O2ProcessingView, lang, template) {
  "use strict";
  return O2ProcessingView.extend({
    className: function() {
      return O2ProcessingView.prototype.className + " mass-update-validation-processing";
    },
    template: template,
    constructor: function MassUpdateValidationProcessingView() {
      O2ProcessingView.prototype.constructor.apply(this, arguments);
    },
    getTitle: function() {
      return lang.processingTitle;
    },
    templateHelpers: function() {
      return {
        labelProcessing: lang["processing" + this.options.langPrefix + "sLabel"],
        percentage: 0
      };
    },
    initialize: function() {
      return;
    },
    onStepBeforeActive: function() {
      return;
    },
    onStepActive: function() {
      this.pendingDfd = $.Deferred();
      this.options.massUpdateData.massUpdateValidationWaitPromise.always(this.pendingDfd.resolve).done(this.handleProcessingSuccess.bind(this)).fail(this.handleProcessingFailure.bind(this));
    },
    handleProcessingSuccess: function(nextStep) {
      if (this.wizard.isDestroyed) {
        return;
      }
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingSuccess.bind(this, nextStep));
      } else {
        this.nextStepId = nextStep;
        this.wizard.nextStep();
      }
    },
    handleProcessingFailure: function() {
      if (this.wizard.isDestroyed) {
        return;
      }
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingFailure.bind(this));
      } else {
        this.wizard.close();
      }
    },
    isMinimizable: function() {
      return this.options.context instanceof PerspectiveContext && this.wizard.isMinimizable();
    },
    getMinimizelabels: function() {
      var label = this.options.massUpdateOptions.collection.length === 1 ? "Single" : "Multiple" + this.options.langPrefix;
      var value = this.options.massUpdateOptions.collection.length === 1 ? this.options.massUpdateOptions.collection.models[0].get("name") : this.options.massUpdateOptions.collection.length;
      return {
        ProcessingHeaderTitle: _.str.sformat(lang["validation" + label + "sLabel"], value, this.options.massUpdateOptions["massupdate_config_label"] || this.options.massUpdateOptions["massupdate_config_name"]),
        CompletedHeaderTitle: _.str.sformat(lang["completed" + label + "sLabel"], value, this.options.massUpdateOptions["massupdate_config_label"] || this.options.massUpdateOptions["massupdate_config_name"])
      };
    }
  });
});