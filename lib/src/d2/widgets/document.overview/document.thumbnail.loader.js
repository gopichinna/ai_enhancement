/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/marionette", "nuc/utils/base", "d2/models/node.thumbnail.model" ], function($, Marionette, base, ThumbnailModel) {
  "use strict";
  var ThumbnailLoader = Marionette.Object.extend({
    constructor: function ThumbnailLoader() {
      Marionette.Object.prototype.constructor.apply(this, arguments);
    },
    url: function() {
      return undefined;
    },
    loadUrl: function() {
      return this.load();
    },
    load: function() {
      return new ThumbnailModel(this.options.node).fetch({
        success: function(model) {
          var thumbnail_url = model.get("thumbnail_url");
          if (thumbnail_url) {
            this.triggerMethod("loadUrl", this, thumbnail_url);
          } else {
            this.triggerMethod("error", this);
          }
        }.bind(this),
        error: function(model, response, options) {
          this.handleFailure(options.xhr);
        }.bind(this)
      });
    },
    handleFailure: function(xhr) {
      this.url = null;
      var error = new base.Error(xhr);
      this.triggerMethod("error", this, error);
    }
  });
  return ThumbnailLoader;
});