/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/rest.linkrels" ], function(_, RestLinkrels) {
  "use strict";
  var ServerAdaptorMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function(options) {
          if (options && options.node) {
            if (options.node.get("csuiThumbnailImageUrl")) {
              this.imgUrl = options.node.get("csuiThumbnailImageUrl");
            }
            options.node.thumbnail = this;
          }
          return this;
        },
        url: function() {
          var node = this.options.node;
          return node.get("csuiThumbnailImageUrl") || node.thumbnail && node.thumbnail.imgUrl;
        },
        loadUrl: function() {
          this.load();
        },
        load: function() {
          this.imgUrl = this.url();
          this.options.node.set("csuiThumbnailImageUrl", this.imgUrl, {
            silent: true
          });
          this.triggerMethod("loadUrl", this, this.imgUrl);
        },
        available: function() {
          return !!this.url();
        },
        getPhotOptions: function(node) {
          return {
            url: RestLinkrels.getLink(node.get("links"), RestLinkrels.DOWNLOAD_URLS)
          };
        },
        getContentUrl: function(response) {
          return response && response.entries[0] && response.entries[0].content && response.entries[0].content.url;
        }
      });
    }
  };
  return ServerAdaptorMixin;
});