/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/log", "smart/dialogs/modal.alert/modal.alert" ], function(log, SmartModelAlert) {
  "use strict";
  log.warn("Use modal alert from smart controls instead of depending on csui modal alert");
  var ModalAlertView = SmartModelAlert.extend({
    constructor: function ModalAlertView(options) {
      SmartModelAlert.prototype.constructor.call(this, options);
    }
  });
  return ModalAlertView;
});