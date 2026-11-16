/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery" ], function(require, $) {
  "use strict";
  require([ "csui/utils/commands/impl/full.page.modal/full.page.modal.view" ], function(FullPageModalView) {
    var FullPageModalViewProto = FullPageModalView.prototype;
    var originalShow = FullPageModalViewProto.show;
    var originalOnRender = FullPageModalViewProto.onRender;
    FullPageModalView.prototype.show = function() {
      this.originalFocus = $(document.activeElement);
      return originalShow.apply(this, arguments);
    };
    FullPageModalView.prototype.onRender = function() {
      this.listenTo(this.view, "destroy", function() {
        this.originalFocus && this.originalFocus.trigger("focus");
      }.bind(this));
      originalOnRender.apply(this, arguments);
    };
  });
});