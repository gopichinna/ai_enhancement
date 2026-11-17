/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "dctmw/controls/form/fields/dctmwurlfield.view" ], function(_, $, DctmwUrlFieldView) {
  "use strict";
  const D2UrlFieldView = DctmwUrlFieldView.extend({
    constructor: function D2URLFieldView() {
      DctmwUrlFieldView.apply(this, arguments);
    },
    getEditValue: function() {
      var val = DctmwUrlFieldView.prototype.getEditValue.apply(this, arguments), model = this.options.model || this.model;
      if (model.get("options").massUpdateFileCount && _.isEmpty(val) && this.showMultiplePlaceholder) {
        val = this.ui.writeField.attr("placeholder");
      }
      return val;
    }
  });
  return D2UrlFieldView;
});