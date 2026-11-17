/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone" ], function(_, Backbone) {
  "use strict";
  var ToolItemModel = Backbone.Model.extend({
    idAttribute: null,
    isSeparator: function() {
      return this.get("signature") == ToolItemModel.separator_signature;
    }
  });
  ToolItemModel.createSeparator = function() {
    return new ToolItemModel({
      signature: ToolItemModel.separator_signature
    });
  };
  ToolItemModel.separator_signature = "-";
  return ToolItemModel;
});