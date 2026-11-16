/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/dialog/dialog.view" ], function(_, $, Backbone, Marionette, DialogView) {
  "use strict";
  var NonOverflowingDialogView = DialogView.extend({
    constructor: function NonOverflowingDialogView(options) {
      options = options || {};
      DialogView.prototype.constructor.call(this, options);
    },
    onRender: function() {
      var retVal = DialogView.prototype.onRender.apply(this, arguments);
      this.ui.header && this.ui.header.addClass("binf-hidden");
      return retVal;
    },
    onShow: function() {
      var retVal = DialogView.prototype.onShow.apply(this, arguments);
      var modalInstance = this.$el.data("binf.modal");
      modalInstance.scrollbarWidth = 0;
      return retVal;
    },
    onShown: function() {
      this.$el.css({
        padding: 0,
        margin: 0
      });
      this.trigger("dialog:shown");
      return DialogView.prototype.onShown.apply(this, arguments);
    },
    onHiding: function() {
      this.$el.removeClass("binf-in");
      return DialogView.prototype.onHiding.apply(this, arguments);
    },
    kill: function() {
      this._isDialogDestroying = true;
      return DialogView.prototype.kill.apply(this, arguments);
    },
    onKeyInView: function(event) {
      if (event.keyCode === 27 && !event.isDefaultPrevented()) {
        event.stopPropagation();
      }
    }
  });
  return NonOverflowingDialogView;
});