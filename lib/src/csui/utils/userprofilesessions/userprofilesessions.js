/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/userprofilesessions/userprofilesessions.tabs/userprofilesessions.tabs.view", "csui/utils/userprofilesessions/userprofilesessions.tabs/userprofilesessions.tabs", "i18n!csui/utils/userprofilesessions/impl/nls/lang" ], function(UserProfileSessionsTabsView, UserProfileSessionsTabs, lang) {
  "use strict";
  return [ {
    tabName: "userprofilesessions",
    tabDisplayName: lang.sessionsTabTitle,
    tabContentView: UserProfileSessionsTabsView,
    showTab: function(model, options) {
      if (UserProfileSessionsTabs.length && options.showUserProfileSessions !== undefined) {
        return options.showUserProfileSessions === true;
      }
      return false;
    }
  } ];
});