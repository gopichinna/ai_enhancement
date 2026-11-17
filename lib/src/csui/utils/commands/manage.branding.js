/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "csui/lib/jquery", "csui/models/command", "csui/utils/commonconfig.util", "smart/themes/theming" ], function(require, $, Command, CommonConfigUtil, theming) {
  "use strict";
  let ManageBranding = Command.extend({
    defaults: {
      signature: "ManageBranding"
    },
    enabled: function(status, options) {
      const enableSideBar = CommonConfigUtil.enableSideBar();
      const context = status.context || options && options.context;
      const applicationScope = context._applicationScope.get("id");
      return context.perspective.get("canEditPerspective") && !applicationScope && !!enableSideBar && (theming?.isJATOTheme() ? CommonConfigUtil.enableJatoBranding() : true);
    },
    execute: function(status, options) {
      const deferred = $.Deferred();
      const context = status.context || options && options.context;
      const brandingView = `csui/perspective.manage/${theming?.isJATOTheme() && CommonConfigUtil.enableJatoBranding() ? "jato/" : ""}branding.view`;
      require([ brandingView ], function(BrandingView) {
        const brandingView = new BrandingView({
          context: context
        });
        brandingView.show();
        deferred.resolve();
      }, deferred.reject);
      return deferred.promise();
    }
  });
  return ManageBranding;
});