/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette" ], function(_, Marionette) {
  "use strict";
  var LayoutViewEventsPropagationMixin = {
    propagateEventsToRegions: function() {
      _.each(this._eventsToPropagateToRegions, _.bind(this._propagateEventToRegions, this));
    },
    _propagateEventToRegions: function(name) {
      this.listenTo(this, name, function() {
        var regions;
        if (this.regionManager) {
          regions = this.regionManager.getRegions();
        } else {
          regions = this.getRegions();
        }
        _.each(regions, function(region) {
          var view = region.currentView;
          if (view?._isRendered && Marionette.isNodeAttached(view.el)) {
            var parameters = Array.prototype.slice.call(arguments);
            parameters.unshift(region.currentView, name);
            Marionette.triggerMethodOn.apply(Marionette, parameters);
          }
        }, this);
      });
    },
    mixin: function(prototype) {
      _.extend(prototype, {
        propagateEventsToRegions: this.propagateEventsToRegions,
        _propagateEventToRegions: this._propagateEventToRegions,
        _eventsToPropagateToRegions: this._eventsToPropagateToRegions
      });
    },
    _eventsToPropagateToRegions: [ "dom:refresh" ]
  };
  return LayoutViewEventsPropagationMixin;
});