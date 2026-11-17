/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
export default {
  reConfigureUserSessionModule: function(config) {
    const sessionTimeout = config.sessionTimeout;
    if (sessionTimeout) {
      const sessionTimeoutTimer = config.sessionTimeoutTimer;
      const allowTokenRefresh = config.allowTokenRefresh ? 1 : 2, kindnessPeriod = (config.kindnessPeriod || 3) * 1e3;
      csui.require.undef("dctmw/overrides/csui/utils/user.session");
      csui.require.undef("csui/utils/user.session/user.session");
      csui.require.config({
        config: {
          "csui/utils/user.session/user.session": {
            enableExpirationHandling: true,
            sessionInactivity: (sessionTimeout - sessionTimeoutTimer) * 1e3,
            kindnessPeriod: kindnessPeriod,
            sessionReactionTime: sessionTimeoutTimer * 1e3,
            cookieExpirationMode: allowTokenRefresh
          }
        }
      });
      csui.require([ "dctmw/overrides/csui/utils/user.session" ], function() {});
    }
  }
};