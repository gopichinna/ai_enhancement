/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/log", "d2/widgets/metadata/general.panels/d2/d2.general.form.view", "hbs!d2/dialogs/print/impl/print.view", "css!d2/dialogs/print/impl/print.view" ], function(_, $, Backbone, log, D2GeneralFormView, formTemplate) {
  "use strict";
  var PrintView = D2GeneralFormView.extend({
    formTemplate: formTemplate,
    constructor: function PrintView(options) {
      options.mode = "create";
      D2GeneralFormView.prototype.constructor.call(this, options);
    },
    _renderContent: function() {
      D2GeneralFormView.prototype._renderContent.call(this);
      this.$form.on("field:keydown", _.bind(this._keydownChange, this));
    },
    _keydownChange: function(event, args) {
      this.triggerMethod("keydown:field", event, args);
    }
  });
  return PrintView;
});