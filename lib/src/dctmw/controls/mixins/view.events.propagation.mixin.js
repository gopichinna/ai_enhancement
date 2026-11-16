/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import Marionette from "nuc/lib/marionette";

const ViewEventsPropagationMixin = {
  propagateEventsToViews() {
    const views = Array.prototype.slice.call(arguments);
    _.each(_.uniq(_.union(this._eventsToPropagateToViews, this._allTimePropagableEvents)), _.bind(this._propagateEventToViews, this, views));
  },
  cancelEventsToViewsPropagation() {
    const views = Array.prototype.slice.call(arguments);
    _.each(_.uniq(_.union(this._eventsToPropagateToViews, this._allTimePropagableEvents)), _.bind(this._cancelEventToViewsPropagation, this, views));
  },
  _propagateEventToViews(views, eName) {
    _.each(views, function(view) {
      const childView = view;
      view.listenTo(this, eName, function() {
        if (_.includes(this._allTimePropagableEvents, eName) || (childView._isShown || childView._isAttached) && childView._isRendered && Marionette.isNodeAttached(childView.el)) {
          const parameters = Array.prototype.slice.call(arguments);
          parameters.unshift(childView, eName);
          Marionette.triggerMethodOn.apply(Marionette, parameters);
        }
      }.bind(this));
    }, this);
  },
  _cancelEventToViewsPropagation(views, name) {
    _.each(views, function(view) {
      view.stopListening(this, name, undefined, this);
    }, this);
  },
  _eventsToPropagateToViews: [ "dom:refresh" ],
  _allTimePropagableEvents: []
};

export default ViewEventsPropagationMixin;