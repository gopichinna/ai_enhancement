/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/marionette", "dctmw/controls/signin/location.view" ], function(Marionette, LocationItemView) {
  "use strict";
  var LocationListView = Marionette.CollectionView.extend({
    tagName: "select",
    tabindex: "0",
    childView: LocationItemView,
    className: "location-select",
    attributes: {
      "aria-label": "Select a network location",
      required: "required"
    }
  });
  return LocationListView;
});