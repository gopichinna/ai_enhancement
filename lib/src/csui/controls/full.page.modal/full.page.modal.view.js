/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/marionette", "csui/utils/non-emptying.region/non-emptying.region", "hbs!csui/controls/full.page.modal/full.page.modal", "css!csui/controls/full.page.modal//full.page.modal", "csui/lib/binf/js/binf" ], function($, Marionette, NonEmptyingRegion, template) {
  "use strict";
  var FullPageModal = Marionette.LayoutView.extend({
    className: "csui-full-page-modal binf-modal binf-fade",
    template: template,
    regions: {
      content: ".binf-modal-content"
    },
    events: {
      "shown.binf.modal": "_refresh",
      "hidden.binf.modal": "destroy"
    },
    constructor: function FullPageModal(options) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.view = this.options.view;
    },
    show: function() {
      var container = $.fn.binf_modal.getDefaultContainer(), region = new NonEmptyingRegion({
        el: container
      });
      region.show(this);
      return this;
    },
    onRender: function() {
      this.listenTo(this.view, "destroy", function() {
        this.$el.binf_modal("hide");
      });
      $(window).scrollTop(0);
      this.$el.binf_modal({
        backdrop: "static",
        keyboard: false
      });
    },
    _refresh: function() {
      this.content.show(this.options.view);
      this.view.triggerMethod("dom:refresh");
    }
  });
  return FullPageModal;
});