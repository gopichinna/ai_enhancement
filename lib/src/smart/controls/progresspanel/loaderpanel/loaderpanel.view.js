/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "smart/utils/smart.base", "i18n!smart/controls/progresspanel/loaderpanel/impl/nls/lang", "hbs!smart/controls/progresspanel/loaderpanel/impl/loaderpanel", "css!smart/controls/progresspanel/loaderpanel/impl/loaderpanel" ], function(_, $, Backbone, Marionette, smartBase, Lang, template) {
  var LoaderPanelView = Marionette.ItemView.extend({
    template: template,
    templateHelpers: function() {
      return {
        label: this.options.label,
        cancel: Lang.cancel || "Cancel",
        enableCancel: this.options.enableCancel || this.options.enableCancel === undefined ? true : false
      };
    },
    ui: {
      cancel: ".csui-loader-cancel"
    },
    className: "smart-loader-panel",
    events: {
      "click @ui.cancel": "cancelAndHide",
      "keydown @ui.cancel": "onKeyDown"
    },
    constructor: function LoaderPanelView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
    },
    cancelAndHide: function(event) {
      if (this.options.xhr && this.options.xhr.abort) {
        this.options.xhr.abort();
      }
      this.destroy(false);
    },
    onKeyDown: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.cancelAndHide(event);
      }
    },
    doShow: function(relatedView, parentView, xhr) {
      this.options.messageHelper.showPanel(this, relatedView, parentView);
      this.doResize();
      this.$el.trigger("globalmessage.shown", this);
      this.ui.cancel.trigger("focus");
      this.updateXHRReference(xhr);
    },
    updateXHRReference: function(xhr) {
      if (xhr) {
        this.options.xhr && this.options.xhr.abort();
        this.options.xhr = xhr;
      }
    },
    doResize: function() {
      if (this.options.sizeToParentContainer) {
        var minWidth = parseInt(this.$el.css("min-width"), 10);
        var width = this.$el.width();
        var parentWidth = this.$el.parent().width();
        this.uncompressedMinWidth || (this.uncompressedMinWidth = minWidth);
        if (this.uncompressedMinWidth > parentWidth) {
          this.$el.addClass("compressed");
        } else {
          this.$el.removeClass("compressed");
        }
        var newWidth = this.$el.width();
        var translateX = (parentWidth - newWidth) / 2;
        translateX > 0 || (translateX = 0);
        translateX = !!smartBase.isRTL() ? -translateX : translateX;
        translateX = "translateX(" + translateX + "px)";
        this.$el.css({
          transform: translateX
        });
      }
    }
  });
  return LoaderPanelView;
});