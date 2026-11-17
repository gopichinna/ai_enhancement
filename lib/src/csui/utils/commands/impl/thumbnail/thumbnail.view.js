/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette", "csui/utils/commands/impl/thumbnail/thumbnail.object", "hbs!csui/utils/commands/impl/thumbnail/loading.thumbnail", "hbs!csui/utils/commands/impl/thumbnail/no.thumbnail", "hbs!csui/utils/commands/impl/thumbnail/thumbnail", "css!csui/utils/commands/impl/thumbnail/thumbnail" ], function(Marionette, Thumbnail, loadingThumbnail, noThumbnail, thumbnail) {
  "use strict";
  var ThumbnailView = Marionette.ItemView.extend({
    className: "csui-thumbnail",
    getTemplate: function() {
      var url = this.thumbnail.url;
      return url === undefined ? loadingThumbnail : url ? thumbnail : noThumbnail;
    },
    constructor: function ThumbnailView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.thumbnail = this.options.thumbnail || new Thumbnail({
        node: this.options.node
      });
      this.listenTo(this.thumbnail, "load", this.render).listenTo(this.thumbnail, "error", this.render).listenTo(this, "render", function() {
        this.thumbnail.url === undefined && this.thumbnail.load();
      }).listenTo(this, "destroy", function() {
        this.thumbnail.destroy();
      });
    },
    serializeData: function() {
      return {
        url: this.thumbnail.url
      };
    }
  });
  return ThumbnailView;
});