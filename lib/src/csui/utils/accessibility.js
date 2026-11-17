/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  "use strict";
  var _accessibleMode = module.config().enabled || false;
  var _accessibleTable = module.config().accessibleTable || false;
  var _enforceDescriptionColumn = module.config().enforceDescriptionColumn;
  var Accessibility = {
    isAccessibleMode: function() {
      return _accessibleMode;
    },
    isAccessibleTable: function() {
      return _accessibleMode || _accessibleTable;
    },
    shouldEnforceDescriptionColumn: function() {
      if (_enforceDescriptionColumn === undefined) {
        return true;
      }
      return _enforceDescriptionColumn;
    }
  };
  return Accessibility;
});