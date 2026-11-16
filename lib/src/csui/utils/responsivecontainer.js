/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  "use strict";
  var _responsiveContainerModeEnabled = module.config().enabled || false;
  var _responsiveContainerModeOn = module.config().isResponsiveContainerModeOn || false;
  var _responsiveContainerMessageModeOn = module.config().isResponsiveContainerMessageModeOn || false;
  var ResponsiveContainer = {
    isResponsiveContainerModeEnabled: function() {
      return _responsiveContainerModeEnabled;
    },
    isResponsiveContainerOn: function() {
      return _responsiveContainerModeOn;
    },
    isResponsiveContainerMessageModeOn: function() {
      return _responsiveContainerMessageModeOn;
    },
    setCurrentView: function(view) {
      if (this._currentView) {
        this._prevView = this._currentView;
      }
      this._currentView = view;
    },
    getCurrentView: function() {
      return this._currentView;
    },
    getPrevView: function() {
      return this._prevView ? this._prevView : null;
    }
  };
  return ResponsiveContainer;
});