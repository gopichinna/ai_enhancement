/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore" ], function(_) {
  function InlineFormViewRegistry() {
    this._addableTypes = {};
  }
  _.extend(InlineFormViewRegistry.prototype, {
    getInlineFormView: function(addableType) {
      return this._addableTypes[addableType];
    },
    registerByAddableType: function(addableType, InlineFormViewClass) {
      if (!_.isNumber(addableType)) {
        throw new Error("addableType key must be a number");
      }
      this._addableTypes[addableType] = InlineFormViewClass;
    }
  });
  return new InlineFormViewRegistry();
});