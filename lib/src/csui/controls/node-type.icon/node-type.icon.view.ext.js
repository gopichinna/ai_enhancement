/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/url" ], function(Url) {
  "use strict";
  function needsAjax(url) {
    var connector = this.options.node.connector;
    var connectUrl = connector && connector.getConnectionUrl();
    if (connector && connectUrl) {
      var absoluteUrl = url;
      if (!new Url(url).isAbsolute()) {
        if (url.startsWith("/")) {
          absoluteUrl = Url.combine(connectUrl.getOrigin(), url);
        } else {
          absoluteUrl = Url.combine(connectUrl.getCgiScript(), url);
        }
      }
      if (absoluteUrl.startsWith(connectUrl.getCgiScript())) {
        return true;
      }
    }
  }
  return {
    needsAjax: needsAjax
  };
});