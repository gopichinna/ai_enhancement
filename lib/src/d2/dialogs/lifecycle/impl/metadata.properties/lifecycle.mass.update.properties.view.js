/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/dialogs/mass.update/mass.update.property.page/mass.update.property.view", "i18n!d2/dialogs/lifecycle/impl/nls/lang" ], function(_, D2MassUpdatePropertiesView, lang) {
  "use strict";
  return D2MassUpdatePropertiesView.extend({
    className: function() {
      return D2MassUpdatePropertiesView.prototype.className + " lifecycle-mass-update-properties";
    },
    constructor: function LifecycleMetadataPropertiesView(options) {
      D2MassUpdatePropertiesView.prototype.constructor.call(this, options);
    },
    getTitle: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return this.metadataView.expandFieldRegion.currentView.getTitle();
      }
      var title = this.options.status && this.options.status.actionMenuLabel ? this.options.status.actionMenuLabel : lang.EditProperties_Title;
      return title;
    },
    isValid: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return this.metadataView.expandFieldRegion.currentView.isValid();
      } else {
        return this.metadataView.isValid();
      }
    },
    isPreviousButtonHidden: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView || this.options.status && this.options.status.lifeCycleStateConfig && this.options.status.lifeCycleStateConfig["signoff_required"]) {
        return false;
      }
      return true;
    },
    getNextButtonLabel: function() {
      if (this.metadataView.expandFieldRegion && this.metadataView.expandFieldRegion.currentView) {
        return this.metadataView.expandFieldRegion.currentView.getNextButtonLabel();
      } else {
        return lang.D2LifcycleSubmitStepLabel;
      }
    }
  });
});