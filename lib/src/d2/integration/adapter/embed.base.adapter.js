/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone" ], function($, _, Backbone) {
  "use strict";
  var EmbedBaseAdapter = function(options) {
    options = options || {};
    this.context = options.context;
    this.connector = options.connector;
    this.params = options.params;
  };
  _.extend(EmbedBaseAdapter.prototype, Backbone.Events, {
    preProcess: function() {
      return $.Deferred().resolve().promise();
    },
    postProcess: function() {
      return;
    }
  });
  EmbedBaseAdapter.extend = Backbone.View.extend;
  return EmbedBaseAdapter;
});