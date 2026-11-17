/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone" ], function($, Backbone) {
  var HistoryModel = Backbone.Model.extend({
    defaults: {
      id: 0
    },
    constructor: function Comment() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  return HistoryModel;
});