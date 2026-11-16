/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette" ], function(Marionette) {
  "use strict";
  var NonAttachingRegion = Marionette.Region.extend({
    constructor: function NonAttachingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },
    attachHtml: function(view) {}
  });
  return NonAttachingRegion;
});