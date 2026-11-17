/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "i18n!csui/models/widget/nls/lang" ], function(_, Backbone, lang) {
  "use strict";
  var MySharesColumnModel = Backbone.Model.extend({
    idAttribute: null,
    constructor: function MySharesColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        attributes.title = lang[attributes.column_key];
      }
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  var MySharesColumnCollection = Backbone.Collection.extend({
    model: MySharesColumnModel,
    resetMySharesCollection: function(response, options) {
      var columns;
      if (response && response.columns) {
        columns = _.map(response.columns, function(column) {
          return new MySharesColumnModel(column);
        });
      }
      this.reset(columns, options);
      this.fetched = true;
    }
  });
  return MySharesColumnCollection;
});