/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/backbone", "nuc/lib/marionette", "css!smart/controls/globalmessage/impl/messagedialog" ], function(Backbone, Marionette) {
  "use strict";
  var CustomWrapperView = Marionette.ItemView.extend({
    constructor: function CustomWrapperView(options) {
      Marionette.ItemView.prototype.constructor.call(this, options);
      var contentView = this.getOption("contentView");
      if (!(contentView instanceof Backbone.View)) {
        contentView = contentView.call(this);
      }
      this.view = contentView;
      this.listenTo(contentView, "destroy", this.destroy);
      this.region = new Marionette.Region({
        el: this.el
      });
    },
    className: "csui-messagepanel",
    template: false,
    onRender: function() {
      this.region.show(this.view);
    },
    onDestroy: function() {
      this.region.empty();
    },
    doShow: function(relatedView, parentView) {
      this.options.messageHelper.showPanel(this, relatedView, parentView);
    }
  });
  return CustomWrapperView;
});