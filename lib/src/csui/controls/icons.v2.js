/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "smart/controls/icons.v2/icons.v2", "csui-ext!csui/controls/icons.v2" ], function(_, SmartIconsV2, otherIcons) {
  if (otherIcons) {
    if (_.isArray(otherIcons)) {
      for (var i = 0; i < otherIcons.length; i++) {
        var iconsMap = otherIcons[i];
        SmartIconsV2.registerIcons(iconsMap);
      }
    } else {
      SmartIconsV2.registerIcons(otherIcons);
    }
  }
  return SmartIconsV2;
});