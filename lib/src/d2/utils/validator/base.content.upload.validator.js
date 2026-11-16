/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/marionette" ], function($, Marionette) {
  "use strict";
  var BaseContentUploadValidator = Marionette.Object.extend({
    constructor: function BaseContentUploadValidator() {
      Marionette.Object.prototype.constructor.apply(this, arguments);
    },
    validateUploadedContent: function() {
      return $.Deferred().resolve().promise();
    }
  });
  return BaseContentUploadValidator;
});