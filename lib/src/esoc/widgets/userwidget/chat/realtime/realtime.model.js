/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone" ], function($, Backbone) {
  var RealTimeModel = Backbone.Model.extend({
    constructor: function RealTimeModel(options) {
      this.submodel = {};
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },
    initialize: function() {},
    getUserPresence: function(email) {},
    getUsersPresence: function(emailList) {}
  });
  return new RealTimeModel();
});