/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/pages/start/perspective.router" ], function(_, PerspectiveRouter) {
  "use strict";
  var oldConstructor = PerspectiveRouter.prototype.constructor;
  PerspectiveRouter.prototype.constructor = function() {
    oldConstructor.apply(this, arguments);
    this.context.off("change:perspective", this._resetViewStateModel, this);
  };
  PerspectiveRouter.prototype._clearViewStateModelKeys = function _clearViewStateModelKeys(keys) {
    var viewStateModel = this.context.viewStateModel, modified;
    var state = viewStateModel.get("state");
    _.keys(state).forEach(function(key) {
      if (keys.indexOf(key) === -1) {
        delete state[key];
        modified = true;
      }
    });
    if (modified) {
      viewStateModel.unset("state", {
        silent: true
      });
      viewStateModel.set("state", state);
    }
  };
});