/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/controls/form/fields/base/csformarrayfield.editable.behavior" ], function(_, $, FormArrayFieldEditableBehavior) {
  "use strict";
  var prototype = FormArrayFieldEditableBehavior.prototype;
  var oldEventsFn = prototype.events;
  var oldOnFocusOutWrite = prototype.onFocusOutWrite;
  prototype.events = function() {
    if (this.view.model.attributes.options.isGridField) {
      return _.extend({}, FormArrayFieldEditableBehavior.prototype.events, {
        "focusin @ui.flagWriteField": "actionOnFocusIn",
        "focusin @ui.subInputField": "actionOnFocusIn",
        "focusout @ui.writeField": "onFocusOutWrite",
        "focusin @ui.writeField": "onFocusInWrite",
        keyup: "onKeyUp",
        "dp.change": "onKeyUp"
      });
    } else {
      oldEventsFn.call(this);
    }
  };
  prototype.onFocusOutWrite = function() {
    if (this.view.model.attributes.options && this.view.model.attributes.options.isGridField || this.view.alpacaField.options && this.view.alpacaField.options.isGridField) {
      var args = arguments;
      setTimeout(function() {
        oldOnFocusOutWrite.apply(this, args);
        this.view.alpacaField && (this.view.alpacaField.focusout = true);
        if (this.view.alpacaField.isValid()) {
          this.$el.trigger($.Event("field:valid"), this.view);
        } else {
          this.$el.trigger($.Event("field:invalid"), this.view);
        }
      }.bind(this));
    } else {
      oldOnFocusOutWrite.apply(this, arguments);
    }
  };
});