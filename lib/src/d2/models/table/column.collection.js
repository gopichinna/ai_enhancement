/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "i18n!csui/models/widget/nls/lang" ], function(_, Backbone, lang) {
  "use strict";
  var ColumnModel = Backbone.Model.extend({
    idAttribute: null,
    constructor: function ColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        attributes.title = lang[attributes.column_key];
      }
      ColumnModel.__super__.constructor.call(this, attributes, options);
    }
  });
  var ColumnCollection = Backbone.Collection.extend({
    model: ColumnModel,
    resetCollection: function(response, options) {
      var columns, me = this;
      if (response && response.columns) {
        columns = _.map(response.columns, function(column) {
          return new me.model(column);
        });
      }
      this.reset(columns, options);
      this.fetched = true;
    }
  });
  return ColumnCollection;
});