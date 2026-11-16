/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "d2/controls/behaviors/wizard.tabable.region.behavior", "hbs!d2/dialogs/download.confirmation/impl/download.confirmation", "i18n!d2/dialogs/download.confirmation/impl/nls/lang" ], function($, _, Marionette, WizardTabableRegionBehavior, template, lang) {
  "use strict";
  var DownloadDialogFormView = Marionette.ItemView.extend({
    className: "d2-download-confirmation-body",
    template: template,
    events: {
      "change .form-checkbox": "_checkboxChange"
    },
    constructor: function DownloadDialogFormView(options) {
      this.options = options || {};
      this.doNotShowCheckbox = false;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    templateHelpers: function() {
      return {
        iconClass: this.options.iconClass,
        description: lang.DownloadViewDescription,
        checkboxLabel: lang.DonotAskLabel,
        infoMessage: lang.DoNotAskInfoMessage
      };
    },
    _checkboxChange: function(event) {
      this.doNotShowCheckbox = event && event.currentTarget && event.currentTarget.checked;
    }
  });
  return DownloadDialogFormView;
});