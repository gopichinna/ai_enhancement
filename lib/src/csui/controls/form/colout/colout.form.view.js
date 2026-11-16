/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "csui/controls/form/form.view" ], function(module, $, _, Marionette, FormView) {
  var ColoutFormView = FormView.extend({
    constructor: function ColoutFormView(options) {
      this.options = options || {};
      FormView.prototype.constructor.call(this, options);
      this.options = options;
    },
    onRenderForm: function() {
      this.options.orginatingView.triggerMethod("render:form", this.options.originatingView);
    }
  });
  return ColoutFormView;
});