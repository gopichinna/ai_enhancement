/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "i18n!csui/models/widget/nls/lang" ], function(_, Backbone, lang) {
  "use strict";
  var CheckoutColumnModel = Backbone.Model.extend({
    idAttribute: null,
    constructor: function CheckoutColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = attributes.column_key;
        attributes.title = lang[columnKey];
      }
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var CheckoutColumnCollection = Backbone.Collection.extend({
    model: CheckoutColumnModel,
    resetCollection: function(models, options) {
      if (this.cachedColumns && _.isEqual(models, this.cachedColumns)) {
        return;
      }
      this.cachedColumns = _.map(models, function(model) {
        return _.clone(model);
      });
      this.reset(models, options);
      this.fetched = true;
    },
    resetCheckoutCollection: function(response, options) {
      var columns;
      if (response && response.columns) {
        columns = _.map(response.columns, function(column) {
          return new CheckoutColumnModel(column);
        });
      }
      this.resetCollection(columns, options);
    }
  });
  return CheckoutColumnCollection;
});