/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/log", "smart/controls/error/error.view" ], function(log, SmartErrorView) {
  "use strict";
  log.warn("Use error view from smart controls instead of depending on csui error view");
  return SmartErrorView;
});