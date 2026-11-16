/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/utils/base", "csui/controls/thumbnail/content/thumbnail.icon/thumbnail.icon.view" ], function($, base, ThumbnailIconView) {
  "use strict";
  var origShowThumbCarousel = ThumbnailIconView.prototype.showThumbCarousel;
  ThumbnailIconView.prototype.showThumbCarousel = function() {
    var thumbnailView = this._parent && this._parent._parent && this._parent._parent._parent && this._parent._parent._parent._parent && this._parent._parent._parent._parent._parent && this._parent._parent._parent._parent._parent._parent && this._parent._parent._parent._parent._parent._parent._parent;
    if (thumbnailView && thumbnailView.options.selectionImpl === "d2_templates") {
      return true;
    }
    var showGalleryView = false;
    if (base.isSafari() || base.isMSBrowser() || base.isAppleMobile()) {
      showGalleryView = this.model.get("mime_type") && (this.model.get("mime_type").match(/^image\/*[-.\w\s]*$/g) || this.model.get("mime_type").match(/^video\/(mp4|mov)$/g));
    } else {
      showGalleryView = this.model.get("mime_type") && (this.model.get("mime_type").match(/^image\/*[-.\w\s]*$/g) || this.model.get("mime_type").match(/^video\/(mp4|webm|ogg|mov)$/g));
    }
    if (!showGalleryView || showGalleryView.length === 0) {
      this.showingCarousel = false;
    }
    origShowThumbCarousel.apply(this, arguments);
  };
});