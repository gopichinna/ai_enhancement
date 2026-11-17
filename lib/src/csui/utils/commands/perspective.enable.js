/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/models/perspective.command", "smart/controls/globalmessage/globalmessage", "i18n!csui/utils/commands/nls/localized.strings" ], function(PerspectiveCommand, GlobalMessage, lang) {
  "use strict";
  const PerspectiveEnableCommand = PerspectiveCommand.extend({
    defaults: {
      signature: "PerspectiveEnable"
    },
    enabled: function(status) {
      return status.options?.view?.model.get("enabled") === false;
    },
    execute: async function(status, options) {
      let currentView;
      try {
        currentView = options.eventData.view;
        const connection = currentView.options.originatingView.connector;
        const perspective_id = currentView.model.get("av_id");
        const url = `${connection.getConnectionUrl().getApiBase("v2")}perspectives/enable/${perspective_id}`;
        const resp = await connection.makeAjaxCall({
          url: url
        });
        if (resp.results.ok) {
          currentView.model.set("enabled", true);
          const msg = lang.perspectiveEnable.replace("{0}", currentView.model.get("title"));
          GlobalMessage.showMessage("success", msg);
        } else {
          const msg = lang.perspectiveEnableFailed.replace("{0}", currentView.model.get("title"));
          GlobalMessage.showMessage("error", msg);
        }
      } catch (error) {
        const msg = lang.perspectiveEnableFailed.replace("{0}", currentView.model.get("title"));
        GlobalMessage.showMessage("error", msg);
      }
    }
  });
  return PerspectiveEnableCommand;
});