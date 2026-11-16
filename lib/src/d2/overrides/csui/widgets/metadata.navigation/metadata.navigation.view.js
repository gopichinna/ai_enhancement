/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore" ], function(_) {
  "use strict";
  require([ "csui/widgets/metadata.navigation/metadata.navigation.view", "dctmw/utils/authenticators/session" ], function(MetadataNavigationView, Session) {
    var origInitialize = MetadataNavigationView.prototype.initialize;
    var origOnBeforeDestroy = MetadataNavigationView.prototype.onBeforeDestroy;
    var origshowFetchNodeFailMessage = MetadataNavigationView.prototype._showFetchNodeFailMessage;
    MetadataNavigationView.prototype.initialize = function() {
      var session = Session.get();
      this.listenToOnce(session, "begin", this.destroy);
      _.isFunction(origInitialize) && origInitialize.apply(this, arguments);
    };
    MetadataNavigationView.prototype.onBeforeDestroy = function() {
      if (this.context.viewStateModel._currentHistoryEntry && this.context.viewStateModel._currentHistoryEntry.state) {
        this.context.viewStateModel._currentHistoryEntry.state.dropdown = "";
      }
      this.metadataNavigationView.miniviewerView && this.metadataNavigationView.miniviewerView.destroy();
      origOnBeforeDestroy.apply(this, arguments);
    };
    MetadataNavigationView.prototype._showFetchNodeFailMessage = function(error, nodeId) {
      if (this.options.model.get("id") !== nodeId) {
        window.location = window.location.href.replace("navigator", "");
      } else {
        origshowFetchNodeFailMessage.apply(this, arguments);
      }
    };
  });
});