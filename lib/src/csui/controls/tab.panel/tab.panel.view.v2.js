/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/version", "smart/controls/tab.panel/tab.panel.view", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "csui/controls/tab.panel/requiredfield/tab.contents.header.requiredfield.view", "csui/controls/form/pub.sub" ], function(VersionModel, SmartTabPanelView, TabableRegionBehavior, TabContentHeaderRequiredFieldView, PubSub) {
  "use strict";
  var TabPanelView = SmartTabPanelView.extend({
    constructor: function TabPanelView(options) {
      options || (options = {});
      options.regionBehavior = {
        behaviorClass: TabableRegionBehavior,
        notSetFocus: true,
        initialActivationWeight: 100
      };
      SmartTabPanelView.prototype.constructor.call(this, options);
      this.listenTo(this, "render:content:header:right:view", this._initializeContentHeaderRequiredFieldView);
    },
    _initializeContentHeaderRequiredFieldView: function(contentsView, resolve) {
      contentsView.contentHeaderRequiredFieldView = new TabContentHeaderRequiredFieldView(contentsView.options);
      resolve();
    }
  });
  return TabPanelView;
});