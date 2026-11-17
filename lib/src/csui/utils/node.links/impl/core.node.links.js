/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/url", "csui/models/version" ], function(Url, VersionModel) {
  "use strict";
  return [ {
    equals: {
      type: 140
    },
    getUrl: function(node) {
      return node.get("url");
    }
  }, {
    equals: {
      type: 258
    },
    getUrl: function(node) {
      return Url.combine("search/query_id/", node.get("id"));
    }
  }, {
    sequence: 1e3,
    getUrl: function(node) {
      return Url.combine("nodes/", node.get("id"));
    }
  }, {
    equals: {
      type: 144
    },
    getUrl: function(node) {
      var url = Url.combine("nodes/", node.get("id"));
      if (node instanceof VersionModel) {
        var versionNumber = node.get("version_number");
        url = Url.combine(url, "versions/" + versionNumber);
      }
      return url;
    }
  }, {
    equals: {
      type: 292
    },
    getUrl: function(node) {
      return Url.combine("searchtemplates/", node.get("id"));
    }
  } ];
});