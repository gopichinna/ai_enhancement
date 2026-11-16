/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone" ], function(module, _, Backbone) {
  var SearchQueryTargetBrowseModel = Backbone.Model.extend({
    constructor: function SearchQueryTargetBrowseModel(attributes, options) {
      SearchQueryTargetBrowseModel.__super__.constructor.apply(this, arguments);
    },
    toJSON: function() {
      return SearchQueryTargetBrowseModel.__super__.toJSON.apply(this, arguments);
    }
  });
  return SearchQueryTargetBrowseModel;
});