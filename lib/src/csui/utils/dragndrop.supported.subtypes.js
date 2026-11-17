/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui-ext!csui/utils/dragndrop.supported.subtypes" ], function(_, ExtraDragNDropSupportedSubTypes) {
  "use strict";
  var DragNDropSupportedSubTypes = [ 0, 136, 141, 142, 144, 202, 749, 751, 800, 801, 1307, 1308, 30205 ];
  if (ExtraDragNDropSupportedSubTypes) {
    DragNDropSupportedSubTypes = DragNDropSupportedSubTypes.concat(_.flatten(ExtraDragNDropSupportedSubTypes, true));
  }
  return DragNDropSupportedSubTypes;
});