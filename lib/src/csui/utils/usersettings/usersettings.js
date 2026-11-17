/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/usersettings/usersettings.tabs/usersettings.tabs.view", "csui/utils/usersettings/usersettings.tabs/usersettings.tabs", "csui/utils/contexts/factories/user", "i18n!csui/utils/usersettings/impl/nls/lang" ], function(UserSettingsTabsView, UserSettingsTabs, UserModelFactory, lang) {
  "use strict";
  return [ {
    tabName: "usersettings",
    tabDisplayName: lang.settingsTabTitle,
    tabContentView: UserSettingsTabsView,
    showTab: function(model, options) {
      const user = options.context.getModel(UserModelFactory);
      const isProxyUser = !!user.get("proxy_proxy_user_id");
      if (isProxyUser) {
        return false;
      }
      if (UserSettingsTabs.length && options.enableSimpleSettingsModel === true && options.showUserSettings !== undefined) {
        return options.showUserSettings === true;
      }
      return false;
    }
  } ];
});