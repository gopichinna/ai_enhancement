/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/backbone", "csui/utils/url", "i18n!csui/models/impl/nls/lang" ], function(_, Backbone, Url, lang) {
  "use strict";
  var Favorite2ColumnModel = Backbone.Model.extend({
    idAttribute: null,
    constructor: function Favorite2ColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var columnKey = "fav_" + attributes.column_key;
        attributes.title = lang[columnKey];
      }
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });
  return Favorite2ColumnModel;
});