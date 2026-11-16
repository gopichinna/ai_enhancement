/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette" ], function(_, $, Marionette) {
  "use strict";
  var MasterView = Marionette.ItemView.extend({
    template: false,
    constructor: function MasterView(options = {}) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.listenTo(this, "change:location:properties", this._setLocation);
      this.listenTo(this, "toggle:thumbnail:view", this._setGridMode);
      this.gridMode = this.options?.defaultMode === "grid";
      let initLocation = this.options?.initLocation;
      initLocation && this._setLocation(initLocation);
    },
    isGridView: function() {
      let location = this.selectedLocation, locationFactory = location?.get("factory"), enableFun = locationFactory?.enable ?? (opts => {
        return false;
      });
      let isCurrentModeGrid = this.gridMode && enableFun(this.options) && !this.options.search || this.gridMode && this?.enableGridFeature && this.setGrid;
      return isCurrentModeGrid;
    },
    _setGridMode: function(mode = false) {
      this.gridMode = mode;
    },
    _setLocation: function(location) {
      this.selectedLocation = location;
    }
  });
  return MasterView;
});