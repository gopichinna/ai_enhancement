/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/utils/thumbnail/thumbnail.object", "csui/utils/url" ], function(_, thumbnailObject, Url) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          return this;
        },
        url: function() {
          var node = this.options.node, nodeId = node.get("id"), version = node.get("version_number"), versionParam = !!version ? "&version_number=" + version : "";
          return Url.combine(node.connector.connection.url, "/nodes", nodeId, "/thumbnails/medium/content?suppress_response_codes" + versionParam);
        },
        available: function() {
          var supportedTypes = [ 144, 145, 736, 749 ];
          return _.contains(supportedTypes, this.options.node.get("type"));
        },
        getPhotOptions: function(node) {
          node = !!node ? node : this.options.node;
          var nodeId = node && node.get("id"), photoUrl = Url.combine(node.connector.connection.url, "/nodes", nodeId, "/content?suppress_response_codes");
          return {
            url: photoUrl,
            dataType: "binary"
          };
        },
        getContentUrl: function(response) {
          return URL.createObjectURL(response);
        }
      });
    }
  };
  return ServerAdaptorMixin;
});