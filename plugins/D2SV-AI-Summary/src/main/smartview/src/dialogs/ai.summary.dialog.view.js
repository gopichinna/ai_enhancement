define([
  'nuc/lib/marionette',
  'hbs!d2svaisummary/dialogs/impl/ai.summary.dialog'
], function (Marionette, template) {
  'use strict';

  return Marionette.ItemView.extend({
    template: template,

    templateHelpers: function () {
      return {
        objectName: this.options.objectName || 'Document',
        summaryText: this.options.summaryText || 'No summary available.'
      };
    }
  });
});
