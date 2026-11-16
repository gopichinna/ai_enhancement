/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone" ], function(Backbone) {
  "use strict";
  var FacetTopicModel = Backbone.Model.extend({
    idAttribute: "value",
    constructor: function FacetTopicModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }
  });
  return FacetTopicModel;
});