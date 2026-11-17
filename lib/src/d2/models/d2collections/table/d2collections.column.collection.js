/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone" ], function(_, Backbone) {
  "use strict";
  var D2CollectionColumnModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var D2CollectionWidgetColumnCollection = Backbone.Collection.extend({
    model: D2CollectionColumnModel,
    comparator: "sequence",
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new D2CollectionWidgetColumnCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  return D2CollectionWidgetColumnCollection;
});