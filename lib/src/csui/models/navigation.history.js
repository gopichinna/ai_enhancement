/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/lib/backbone", "csui/models/view.state.model" ], function(module, _, Backbone, viewStateModel) {
  "use strict";
  var NavigationHistory = Backbone.History.extend({
    constructor: function NavigationHistory(options) {
      Backbone.History.prototype.constructor.apply(this, arguments);
      var config = _.extend({
        urlCanChange: true
      }, module.config());
      this.urlCanChange = config.urlCanChange;
    },
    is: "CSUINavigationHistory",
    checkUrl: function(e) {
      if (this.urlCanChange) {
        Backbone.History.prototype.checkUrl.call(this, e);
      }
    },
    _updateHash: function(location, fragment, replace) {
      if (this.urlCanChange) {
        Backbone.History.prototype._updateHash.call(this, location, fragment, replace);
      }
    },
    matchRoot: function() {
      if (this.urlCanChange) {
        return Backbone.History.prototype.matchRoot.call(this);
      }
      return true;
    }
  });
  return NavigationHistory;
});