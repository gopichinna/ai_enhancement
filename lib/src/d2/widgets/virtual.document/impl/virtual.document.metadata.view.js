/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/widgets/metadata/metadata.view", "d2/utils/constants" ], function(_, CSMetadataView, constants) {
  "use strict";
  var VirtualDocumentMetadataView = CSMetadataView.extend({
    onResolutionChange: function(resolutionData) {
      if (resolutionData.viewPortWidth <= constants.Resolution.MEDIUM) {
        this.metadataHeaderView.metadataItemNameView._applyToggle(resolutionData.showSideBar);
      } else {
        this.metadataHeaderView.metadataItemNameView._removeToggle();
      }
    },
    constructor: function VirtualDocumentMetadataView(options) {
      CSMetadataView.prototype.constructor.call(this, options);
      this.listenToOnce(this.metadataTabView, "render", function() {
        if (this.metadataTabView.tabLinks && this.metadataTabView.tabLinks.selected) {
          var me = this, showHideMiniviewerBasedOnTab = function(selectedTab) {
            if (selectedTab && selectedTab.get("name") !== "properties") {
              me._triggerMiniviewerVisibilityEvent(false);
            } else {
              me._triggerMiniviewerVisibilityEvent(true);
            }
          };
          this.metadataTabView.tabLinks.selected.on("change:name", showHideMiniviewerBasedOnTab);
          showHideMiniviewerBasedOnTab(this.metadataTabView.tabLinks.selected);
        } else {
          this._triggerMiniviewerVisibilityEvent(true);
        }
      }.bind(this));
    },
    _triggerMiniviewerVisibilityEvent: function(isVisible) {
      this.trigger("change:miniviewer:visibiity", isVisible);
    }
  });
  return VirtualDocumentMetadataView;
});