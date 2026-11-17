/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette", "d2/utils/constants", "d2/dialogs/mass.update/mass.update.document.validation/document.validation.layout.view", "d2/dialogs/mass.update/mass.update.document.validation/document.validation.item.view", "i18n!d2/commands/nls/localized.strings" ], function(_, Marionette, constants, MassUpdateDocumentValidationView, DocumentValidationItemView, lang) {
  "use strict";
  var ErrorLayoutView = MassUpdateDocumentValidationView.extend({
    constructor: function ErrorLayoutView() {
      MassUpdateDocumentValidationView.prototype.constructor.apply(this, arguments);
    },
    _setupChildViews: function() {
      if (this.options.submitErrorNodes && this.options.submitErrorNodes.length > 0) {
        var errorLangKey = this.options.submitErrorNodes.length === 1 ? "MassUpdateErrorUpdateFailed" + this.options.langPrefix + "Header" : "MassUpdateErrorUpdateFailed" + this.options.langPrefix + "sHeader";
        this.failedNodesView = new DocumentValidationItemView(_.extend({
          headerMsg: _.str.sformat(lang[errorLangKey], this.options.submitErrorNodes.length),
          errorNodes: this.options.submitErrorNodes
        }, this.options));
      }
      if (this.options.submitWarningNodes && this.options.submitWarningNodes.length > 0) {
        var warningLangKey = this.options.submitErrorNodes.length === 1 ? "MassUpdateErrorPartialUpdate" + this.options.langPrefix + "Header" : "MassUpdateErrorPartialUpdate" + this.options.langPrefix + "sHeader";
        this.partialUpdatedNodesView = new DocumentValidationItemView(_.extend({
          headerMsg: _.str.sformat(lang[warningLangKey], this.options.submitWarningNodes.length),
          errorNodes: this.options.submitWarningNodes
        }, this.options));
      }
    },
    onRender: function() {
      MassUpdateDocumentValidationView.prototype.onRender.apply(this, arguments);
      var massUpdateConfig = this.options.massUpdateOptions.massUpdateConfig, massUpdateConfigName = massUpdateConfig["massupdate_config_label"] || massUpdateConfig["massupdate_config_name"], successCount = this.options.massUpdateValidationData.validObjects.length - this.options.submitErrorNodes.length, warningLangKey = successCount === 1 ? "MassUpdate" + this.options.langPrefix + "SuccessBanner" : "MassUpdate" + this.options.langPrefix + "sSuccessBanner", message = _.str.sformat(lang[warningLangKey], massUpdateConfigName, successCount);
      this.ui.validationMessageLabel.text(message);
      this.ui.validationHeader.addClass("success");
      this.ui.validationHeader.removeClass("binf-hidden");
    },
    getTitle: function() {
      return lang.MassUpdateDialogTitle;
    },
    getTotalItemCount: function() {
      return this.options.massUpdateValidationData.validObjects.length;
    }
  });
  return ErrorLayoutView;
});