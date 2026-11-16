/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "smart/controls/progresspanel/loaderpanel/loaderpanel.view" ], function(SmartLoaderPanelView) {
  var LoaderPanelView = SmartLoaderPanelView.extend({
    constructor: function LoaderPanelView(options) {
      SmartLoaderPanelView.prototype.constructor.call(this, options);
    }
  });
  return LoaderPanelView;
});