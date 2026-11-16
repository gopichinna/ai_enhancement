/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "i18n!csui/models/widget/nls/lang" ], function(_, Backbone, lang) {
  var metadataColumnModel = Backbone.Model.extend({
    idAttribute: "key",
    defaults: {
      key: null,
      sequence: 0
    }
  });
  var metadataColumnCollection = Backbone.Collection.extend({
    model: metadataColumnModel,
    comparator: "sequence",
    getColumnKeys: function() {
      return this.pluck("key");
    },
    deepClone: function() {
      return new metadataColumnCollection(this.map(function(column) {
        return column.attributes;
      }));
    }
  });
  var metadataColumns = new metadataColumnCollection([]);
  return metadataColumns;
});