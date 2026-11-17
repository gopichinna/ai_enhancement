/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import Marionette from "nuc/lib/marionette";

const LayoutviewEventsPropagationMixin = {
  propagateEventsToRegions() {
    _.each(_.uniq(_.union(this._eventsToPropagateToRegions, this._allTimeEventsToPropagateToRegions)), _.bind(this._propagateEventToRegions, this));
  },
  _propagateEventToRegions(eName) {
    this.listenTo(this, eName, function() {
      let regions;
      if (this.regionManager) {
        regions = this.regionManager.getRegions();
      } else {
        regions = this.getRegions();
      }
      _.each(regions, function(region) {
        const view = region.currentView;
        if (view && (_.includes(this._allTimeEventsToPropagateToRegions, eName) || (view._isShown || view._isAttached) && view._isRendered && Marionette.isNodeAttached(view.el))) {
          const parameters = Array.prototype.slice.call(arguments);
          parameters.unshift(region.currentView, eName);
          Marionette.triggerMethodOn.apply(Marionette, parameters);
        }
      }, this);
    });
  },
  mixin(prototype) {
    _.extend(prototype, {
      propagateEventsToRegions: this.propagateEventsToRegions,
      _propagateEventToRegions: this._propagateEventToRegions,
      _eventsToPropagateToRegions: this._eventsToPropagateToRegions,
      _allTimeEventsToPropagateToRegions: this._allTimeEventsToPropagateToRegions
    });
  },
  _eventsToPropagateToRegions: [ "dom:refresh" ],
  _allTimeEventsToPropagateToRegions: []
};

export default LayoutviewEventsPropagationMixin;