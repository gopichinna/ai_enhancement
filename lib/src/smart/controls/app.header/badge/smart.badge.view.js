/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/log", "nuc/lib/underscore", "nuc/lib/marionette3", "smart/themes/theming" ], function(log, _, Marionette, theming) {
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
    className: "binf-hidden",
    performClickAction: false,
    constructor: function BadgeView(options) {
      Marionette.View.call(this, options);
    },
    supportedAttributes: [ "value" ],
    onShow: function() {
      this.otcData = {};
      this.listenTo(this, "data:synced", _.bind(function() {
        this.otcData = _.extend(this.otcData, this?.leadingView?.otcData);
        let isJATO = theming.isJATOTheme();
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
          if (value !== "") {
            this.el.classList.remove("binf-hidden");
          } else {
            this.el.classList.add("binf-hidden");
          }
          value = value ?? "";
          if (isJATO) {
            !this.otcData?.hideCount && targetEle.setAttribute(attr, value);
          } else {
            targetEle.setAttribute(attr, value);
          }
        });
      }, this));
    }
  });
  return BadgeView;
});