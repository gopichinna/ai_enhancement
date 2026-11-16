/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/log", "csui/dialogs/node.picker/node.picker" ], function(_, log, NodePicker) {
  "use strict";
  function NodePickerV2(options) {
    let warnMessage = 'DEPRECATED: Use "csui/dialogs/node.picker/node.picker" instead.';
    console.warn(warnMessage);
    return new NodePicker(options);
  }
  return NodePickerV2;
});