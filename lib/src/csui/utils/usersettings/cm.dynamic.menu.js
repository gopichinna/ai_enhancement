/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/controls/globalmessage/globalmessage", "csui/utils/contexts/factories/user", "i18n!csui/utils/usersettings/impl/nls/lang" ], function(module, $, GlobalMessage, UserModelFactory, lang) {
  "use strict";
  var menuSet;
  function ProxyDynamicMenu(options) {
    if (menuSet) {
      return $.Deferred().resolve([]);
    }
    menuSet = true;
    let deferred = $.Deferred(), menuItems = [], user = options.context.getModel(UserModelFactory);
    if (user.get("type") === 10) {
      menuItems.push({
        profileMenu: {
          signature: "SwitchToNonCMUser",
          name: lang.endWorkAsCM,
          group: "proxy"
        }
      });
      GlobalMessage.showMessage("warning", lang.cmMode, lang.workingAsMessage);
    }
    deferred.resolve(menuItems);
    return deferred.promise();
  }
  return ProxyDynamicMenu;
});