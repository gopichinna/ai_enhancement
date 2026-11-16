define([
  'd2/sdk/models/table/column.collection'
], function (BaseColumnCollection) {
  'use strict';

  var <%= typedNamePrefix %>ColumnCollection = BaseColumnCollection.extend({
    constructor: function <%= typedNamePrefix %>ColumnCollection(models, options) {
      <%= typedNamePrefix %>ColumnCollection.__super__.constructor.call(this, models, options);
    }
  });

  return <%= typedNamePrefix %>ColumnCollection;
});
