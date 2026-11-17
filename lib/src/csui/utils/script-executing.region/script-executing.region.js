/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette" ], function(Marionette) {
  "use strict";
  var ScriptExecutingRegion = Marionette.Region.extend({
    constructor: function ScriptExecutingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },
    attachHtml: function(view) {
      this.$el.html("").append(view.el);
    }
  });
  return ScriptExecutingRegion;
});