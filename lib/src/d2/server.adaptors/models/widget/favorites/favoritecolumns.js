/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "i18n!csui/models/widget/nls/lang" ], function(_, Backbone, lang) {
  "use strict";
  var FavoriteColumnModel = Backbone.Model.extend({
    idAttribute: null,
    constructor: function FavoriteColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = attributes.column_key;
        attributes.title = lang[columnKey];
      }
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var FavoriteColumnCollection = Backbone.Collection.extend({
    model: FavoriteColumnModel,
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
    resetFavoriteCollection: function(response, options) {
      var columns;
      if (response && response.columns) {
        columns = _.map(response.columns, function(column) {
          return new FavoriteColumnModel(column);
        });
      }
      this.resetCollection(columns, options);
    }
  });
  return FavoriteColumnCollection;
});