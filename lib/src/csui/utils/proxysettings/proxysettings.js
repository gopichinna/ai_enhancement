/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/proxysettings/proxysettings.tabs/proxysettings.tabs.view", "csui/utils/proxysettings/proxysettings.tabs/proxysettings.tabs", "csui/utils/contexts/factories/user", "i18n!csui/utils/proxysettings/impl/nls/lang" ], function(ProxySettingsTabsView, ProxySettingsTabs, UserModelFactory, lang) {
  "use strict";
  return [ {
    tabName: "proxysettings",
    tabDisplayName: lang.proxySettingsTabTitle,
    tabContentView: ProxySettingsTabsView,
    showTab: function(model, options) {
      const user = options.context.getModel(UserModelFactory);
      const isProxyUser = !!user.get("proxy_proxy_user_id");
      if (isProxyUser) {
        return false;
      }
      if (ProxySettingsTabs.length && options.enableSimpleSettingsModel === true && options.showProxySettings !== undefined) {
        return options.showProxySettings === true;
      }
      return false;
    }
  } ];
});