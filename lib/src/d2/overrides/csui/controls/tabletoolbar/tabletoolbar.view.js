/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/tabletoolbar/tabletoolbar.view" ], function(TableToolbarView) {
  "use strict";
  TableToolbarView.prototype._updateAddToolbar = function() {
    var container = this.container;
    if (container) {
      container._fetchMenuNewObjectItems = true;
    }
  };
});