/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/jquery", "csui/lib/underscore", "csui/controls/globalmessage/globalmessage", "csui/utils/proxy", "csui/utils/command.error", "csui/utils/contexts/factories/user", "i18n!csui/utils/proxysettings/impl/nls/proxydynamic.lang" ], function(module, $, _, GlobalMessage, Proxy, CommandError, UserModelFactory, lang) {
  "use strict";
  var menuSet;
  function ProxyDynamicMenu(options) {
    if (menuSet || !Proxy.enabled()) {
      return $.Deferred().resolve([]);
    }
    var deferred = $.Deferred(), url = options.connector.getConnectionUrl().getApiBase("v2") + "members/proxies/targets";
    var getOptions = {
      url: url,
      method: "GET"
    };
    var menuItems = [];
    var user = options.context.getModel(UserModelFactory);
    if (!!user.get("proxy_proxy_user_id")) {
      menuSet = true;
      menuItems.push({
        profileMenu: {
          signature: "SwitchToNonProxyUser",
          name: _.str.sformat(lang.endWorkAs, user.get("display_name")),
          group: "proxy"
        }
      });
      GlobalMessage.showMessage("warning", _.str.sformat(lang.workingAs, user.get("display_name")), _.str.sformat(lang.workingAsMessage, user.get("display_name")));
      deferred.resolve(menuItems);
    } else {
      options.connector.makeAjaxCall(getOptions).then(function(response) {
        menuSet = true;
        _.each(response.results.data, function(user) {
          menuItems.push({
            profileMenu: {
              groupBy: "proxy",
              signature: "SwitchToProxyUser",
              name: user.display_name,
              userid: user.id,
              group: "proxy",
              isSubItem: true
            }
          });
        });
        if (response.results.data.length > 0) {
          menuItems.push({
            profileMenu: {
              groupBy: "proxy",
              signature: "SwitchToProxyUser",
              name: lang.workAs,
              group: "proxy",
              isLabel: true
            }
          });
        }
        deferred.resolve(menuItems);
      }).catch(function(error) {
        deferred.resolve(menuItems);
      });
    }
    return deferred.promise();
  }
  return ProxyDynamicMenu;
});