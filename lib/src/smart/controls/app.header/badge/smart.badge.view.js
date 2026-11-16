/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/log", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "nuc/lib/backbone", "hbs!smart/controls/app.header/menu/impl/smart.menu", "hbs!smart/controls/app.header/menu/impl/smart.menu.item" ], function(log, $, _, Marionette, Backbone, template, menuItemTemplate) {
  "use strict";
  var BadgeView = Marionette.View.extend({
    template: false,
    tagName: "otc-badge",
    attributes: function() {
      var attr = {
        type: "notification",
        slot: "count"
      };
      return attr;
    },
    performClickAction: false,
    constructor: function BadgeView(options) {
      Marionette.View.call(this, options);
    },
    supportedAttributes: [ "value" ],
    onRender: function() {
      let iconTheme = this.options?.parentView?.progressView?.otcData?.iconappearance;
      $(this.options.otcEl).attr("iconappearance", iconTheme ?? "default");
    },
    onShow: function() {
      this.otcData = {};
      this.listenTo(this, "data:synced", _.bind(function() {
        this.otcData = _.extend(this.otcData, this?.leadingView?.otcData);
        this.supportedAttributes.forEach(attr => {
          let targetEle = this.el, value = this.otcData[attr] ? this.otcData[attr] : "";
          if (attr === "value") {
            value = Math.floor(value);
            if (parseInt(value, 10)) {
              if (value < 1) {
                log.warn("Badge does not support numbers less than one");
                value = "";
              } else if (value > 99) {
                value = "99+";
              }
            } else {
              value = "";
            }
            attr = "value";
          }
          targetEle.setAttribute(attr, value ?? "");
        });
      }, this));
    }
  });
  return BadgeView;
});