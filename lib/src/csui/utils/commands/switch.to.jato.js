/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands/switch.to.smartview", "smart/themes/theming" ], function(SwitchToSmartviewCommand, theming) {
  "use strict";
  const SwitchToJato = SwitchToSmartviewCommand.extend({
    defaults: {
      signature: "SwitchToJato"
    },
    enabled: function(status, options) {
      return this.canSwitchToJatoTheme() && !theming.isJATOTheme();
    }
  });
  return SwitchToJato;
});