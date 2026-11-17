/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone" ], function($, _, Backbone) {
  "use strict";
  var SavedSearchColumnModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var SavedSearchTableColumnCollection = Backbone.Collection.extend({
    model: SavedSearchColumnModel,
    comparator: "sequence",
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new SavedSearchTableColumnCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  return SavedSearchTableColumnCollection;
});