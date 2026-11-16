/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/backbone" ], function($, Backbone) {
  var ContactModel = Backbone.Model.extend({
    defaults: {},
    constructor: function ContactModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  return ContactModel;
});