/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/utils/contexts/perspective/perspective.context", "d2/dialogs/mass.update/mass.update.validation.processing/mass.update.validation.processing.view", "i18n!d2/commands/nls/localized.strings", "i18n!d2/dialogs/mass.update/impl/nls/lang" ], function(_, $, PerspectiveContext, MassUpdateValidationProcessingView, commandLang, lang) {
  "use strict";
  return MassUpdateValidationProcessingView.extend({
    constructor: function MassUpdateSubmitProcessingView() {
      MassUpdateValidationProcessingView.prototype.constructor.apply(this, arguments);
    },
    getTitle: function() {
      return lang.updatingTitle;
    },
    getSubTitle: function() {
      var langKey = "MassUpdatePropertyPage" + this.options.langPrefix + "sSubtitle";
      return _.str.sformat(commandLang[langKey], this.options.massUpdateData.massUpdateValidationData.validObjects.length);
    },
    templateHelpers: function() {
      return {
        labelProcessing: lang["updating" + this.options.langPrefix + "sLabel"],
        percentage: 0
      };
    },
    onStepActive: function() {
      this.$el.closest(".binf-modal-dialog").find(".binf-modal-header .cs-close").addClass("binf-hidden");
      this.pendingDfd = $.Deferred();
      this.options.massUpdateData.massUpdateSubmitWaitPromise.always(_.bind(function() {
        this.pendingDfd.resolve();
        this.$el.closest(".binf-modal-dialog").find(".binf-modal-header .cs-close").removeClass("binf-hidden");
      }, this)).done(this.handleProcessingSuccess.bind(this)).fail(this.handleProcessingFailure.bind(this));
    },
    handleProcessingSuccess: function(nextStep, massUpdateData) {
      if (this.wizard.isDestroyed) {
        return;
      }
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingSuccess.bind(this, nextStep, massUpdateData));
      } else {
        if (nextStep) {
          this.wizard.gotoStep(nextStep, massUpdateData);
        } else {
          this.wizard.close(massUpdateData);
        }
      }
    },
    handleProcessingFailure: function(massUpdateError) {
      if (this.wizard.isDestroyed) {
        return;
      }
      if (this.wizardMinimized) {
        this.listenToOnce(this.wizard, "wizard:restored", this.handleProcessingFailure.bind(this, massUpdateError));
      } else {
        this.wizard.close(massUpdateError);
      }
    },
    getMinimizelabels: function() {
      var label = this.options.massUpdateOptions.collection.length === 1 ? "Single" : "Multiple" + this.options.langPrefix;
      var value = this.options.massUpdateOptions.collection.length === 1 ? this.options.massUpdateOptions.collection.models[0].get("name") : this.options.massUpdateOptions.collection.length;
      return {
        ProcessingHeaderTitle: _.str.sformat(lang["updating" + label + "sLabel"], value, this.options.massUpdateOptions["massupdate_config_label"] || this.options.massUpdateOptions["massupdate_config_name"]),
        CompletedHeaderTitle: _.str.sformat(lang["completedUpdating" + label + "sLabel"], value, this.options.massUpdateOptions["massupdate_config_label"] || this.options.massUpdateOptions["massupdate_config_name"])
      };
    }
  });
});