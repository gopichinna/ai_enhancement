/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/backbone", "csui/models/savedquery" ], function(Backbone, SavedQueryModel) {
  "use strict";
  var SavedQueryCollection = Backbone.Collection.extend({
    model: SavedQueryModel,
    constructor: function SavedQueryCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }
  });
  return SavedQueryCollection;
});