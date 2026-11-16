/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/jquery", "csui/lib/backbone" ], function(module, _require, $, Backbone) {
  var SkypeModel = Backbone.Model.extend({
    constructor: function SkypeModel(options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {}
  });
  return SkypeModel;
});