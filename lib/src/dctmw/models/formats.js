/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone" ], function(Backbone) {
  var FormatModel = Backbone.Model.extend({
    idAttribute: "name"
  });
  return Backbone.Collection.extend({
    model: FormatModel
  });
});