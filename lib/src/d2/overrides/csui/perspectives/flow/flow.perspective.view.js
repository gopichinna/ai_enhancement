/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "dctmw/utils/utils", "require", "csui/perspectives/flow/flow.perspective.view" ], function(utils, require, FlowPerspectiveView) {
  "use strict";
  var origCreateColumns = FlowPerspectiveView.prototype._createColumns;
  var origCreateCollection = FlowPerspectiveView.prototype._createCollection;
  FlowPerspectiveView.prototype._createCollection = function(options) {
    if (utils.isMobile()) {
      options.NoBreadCrumbsSupport = true;
    }
    return origCreateCollection.call(this, options);
  };
  FlowPerspectiveView.prototype._createColumns = function() {
    var self = this;
    require([ "d2/controls/landingpage.dnd/landingpage.dnd.view" ], function(LandingPageDndView) {
      self.draganddrop = new LandingPageDndView({
        container: self.$el,
        originatingView: self,
        context: self.options.context
      });
    });
    return origCreateColumns.apply(this, arguments);
  };
});