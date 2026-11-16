/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import lang from "dctmw/pages/app/impl/nls/lang";

const appModules = [ {
  name: "d2",
  basePath: "d2",
  routes: {
    "": "defaultViewState"
  },
  view: function(options = {}) {
    if (options.mobile || options.appworks) {
      if (options.embedMode) {
        options.errorMsg = lang.errorEmbedModeUnsupported;
        return "d2/pages/app/impl/module.error.view";
      }
      return "d2mob/pages/start/d2.mobile.view";
    } else if (options.embedMode) {
      return "d2/pages/start/d2.embed.view";
    } else {
      return "d2/pages/start/d2.view";
    }
  }
} ];

export default appModules;