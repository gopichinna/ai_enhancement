/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module" ], function(module) {
  "use strict";
  var moduleConfig = window.csui.require.s.contexts._.config.config["csui/utils/accessibility"] || module.config();
  var _accessibleMode = moduleConfig.enabled || false;
  var _accessibleTable = moduleConfig.accessibleTable || false;
  var _enforceDescriptionColumn = moduleConfig.enforceDescriptionColumn;
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