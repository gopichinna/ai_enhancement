/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/marionette", "csui/utils/thumbnail/thumbnail.object", "hbs!csui/utils/thumbnail/loading.thumbnail", "hbs!csui/utils/thumbnail/no.thumbnail", "hbs!csui/utils/thumbnail/thumbnail", "i18n!csui/utils/impl/nls/lang", "css!csui/utils/thumbnail/thumbnail" ], function(Marionette, Thumbnail, loadingThumbnail, noThumbnail, thumbnail, lang) {
  "use strict";
  var ThumbnailView = Marionette.ItemView.extend({
    className: "csui-thumbnail",
    getTemplate: function() {
      var imgUrl = this.thumbnail.imgUrl;
      return imgUrl === undefined ? loadingThumbnail({
        loading: lang.Loading
      }) : imgUrl ? thumbnail : noThumbnail({
        notAvailable: lang.NotAvailable
      });
    },
    constructor: function ThumbnailView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.thumbnail = this.options.thumbnail || new Thumbnail({
        node: this.options.node
      });
      this.listenTo(this.thumbnail, "loadUrl", this.render);
      this.listenTo(this.thumbnail, "error", this.render);
      this.listenTo(this, "render", function() {
        this.thumbnail.imgUrl === undefined && this.thumbnail.loadUrl();
      });
      this.listenTo(this, "destroy", function() {
        this.thumbnail.destroy();
      });
    },
    serializeData: function() {
      return {
        imgUrl: this.thumbnail.imgUrl
      };
    }
  });
  return ThumbnailView;
});