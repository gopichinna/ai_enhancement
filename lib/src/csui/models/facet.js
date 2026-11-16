/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/models/facettopics" ], function(Backbone, FacetTopicCollection) {
  "use strict";
  var FacetModel = Backbone.Model.extend({
    constructor: function FacetModel(attributes) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.topics = new FacetTopicCollection(attributes && attributes.topics);
    },
    parse: function(response, options) {
      if (this.topics) {
        this.topics.reset(response.topics);
      }
      return response;
    }
  });
  return FacetModel;
});