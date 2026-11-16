/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define(['module', 'nuc/lib/backbone', 'nuc/utils/log', 'nuc/models/column'], function (
  module,
  Backbone,
  log,
  ColumnModel
) {
  var ColumnCollection = Backbone.Collection.extend({
    model: ColumnModel,

    constructor: function ColumnCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  ColumnCollection.version = '1.0';

  return ColumnCollection;
});
