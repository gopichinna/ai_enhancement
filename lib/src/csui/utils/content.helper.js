/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/url", "csui/models/version" ], function(_, Url, VersionModel) {
  "use strict";
  function getContentPageUrl(node, options) {
    options || (options = {});
    var cgiUrl = new Url(node.connector.connection.url).getCgiScript();
    var urlQuery = {
      func: "doc.fetchcsui",
      nodeid: node.get("id")
    };
    if (options.download) {
      urlQuery = _.extend(urlQuery, {
        action: "download"
      });
    }
    if (node instanceof VersionModel || node.get("version_number")) {
      urlQuery.vernum = node.get("version_number");
    }
    return Url.appendQuery(cgiUrl, Url.combineQueryString(urlQuery));
  }
  return {
    getContentPageUrl: getContentPageUrl
  };
});