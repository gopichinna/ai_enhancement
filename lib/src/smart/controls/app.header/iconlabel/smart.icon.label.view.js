/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/utils/log", "nuc/lib/underscore", "nuc/lib/marionette3", "smart/themes/theming", "hbs!smart/controls/app.header/iconlabel/impl/smart.icon.label", "css!smart/controls/app.header/iconlabel/impl/smart.icon.label" ], function(log, _, Marionette, theming, template) {
  "use strict";
  var IconLabelView = Marionette.View.extend({
    template: template,
    templateContext: function() {
      let messages = this?.otcData ?? {};
      let isJATO = theming.isJATOTheme();
      messages.icon = messages.icon;
      messages.iconText = messages.iconText;
      messages.jatoIcon = isJATO && messages.jatoIcon;
      return messages;
    },
    attributes: function() {
      var attr = {
        type: "",
        slot: this?.otcData?.slot ?? ""
      };
      return attr;
    },
    className: "smart-icon-label-container",
    performClickAction: false,
    constructor: function IconLabelView(options) {
      Marionette.View.call(this, options);
    },
    supportedAttributes: [ "title", "slot" ],
    onShow: function() {
      this.otcData = {};
      this.options.otcEl.classList.add("smart-icon-label");
      this.listenTo(this, "data:synced", _.bind(function() {
        let isJATO = theming.isJATOTheme();
        this.supportedAttributes.forEach(attr => {
          let targetEle = this.options.otcEl, value = this.otcData[attr] ? this.otcData[attr] : "";
          value = value ?? "";
          targetEle.setAttribute(attr, value);
        });
      }, this));
    }
  });
  return IconLabelView;
});