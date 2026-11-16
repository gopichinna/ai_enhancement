/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/models/facettopic" ], function(Backbone, FacetTopicModel) {
  "use strict";
  var FacetTopicCollection = Backbone.Collection.extend({
    model: FacetTopicModel,
    constructor: function FacetTopicCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  return FacetTopicCollection;
});