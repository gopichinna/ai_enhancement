/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/marionette", "csui/utils/log", "csui/lib/handlebars" ], function(module, _, Marionette, log, Handlebars) {
  "use strict";
  log = log(module.id);
  var TimeValueSecondsView = Marionette.ItemView.extend({
    className: "csui-time-value-sec-value",
    tagName: "span",
    modelEvents: {
      change: "render"
    },
    template: Handlebars.compile("{{timeValueSeconds}}"),
    templateHelpers: function() {
      return {
        timeValueSeconds: this.model.get("seconds")
      };
    },
    constructor: function TimeValueSecondsView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
    }
  });
  return TimeValueSecondsView;
});