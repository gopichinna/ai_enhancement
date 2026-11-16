/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/toolbar/flyout.toolitem.view" ], function($, _, FlyoutToolItemView) {
  "use strict";
  var originalTempateHelper = FlyoutToolItemView.prototype.templateHelpers;
  FlyoutToolItemView.prototype.templateHelpers = function() {
    var templateHelperData = originalTempateHelper.apply(this, arguments);
    if (this.model && this.model.get("name")) {
      templateHelperData.name = $("<textarea/>").html(this.model.get("name")).text();
    }
    return templateHelperData;
  };
});