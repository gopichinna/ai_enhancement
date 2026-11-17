/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone" ], function($, _, Backbone) {
  "use strict";
  var FieldOptionModel = Backbone.Model.extend({
    constructor: function FieldOptionModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  return FieldOptionModel;
});