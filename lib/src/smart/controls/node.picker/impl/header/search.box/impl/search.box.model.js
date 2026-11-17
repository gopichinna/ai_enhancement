/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone" ], function(module, _, Backbone) {
  var SearchBoxModel = Backbone.Model.extend({
    constructor: function SearchBoxModel(attributes, options) {
      SearchBoxModel.__super__.constructor.apply(this, arguments);
    },
    toJSON: function() {
      return SearchBoxModel.__super__.toJSON.apply(this, arguments);
    }
  });
  return SearchBoxModel;
});