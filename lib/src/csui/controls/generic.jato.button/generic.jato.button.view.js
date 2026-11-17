/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/jquery", "csui/lib/underscore", "csui/lib/marionette", "smart/themes/theming", "hbs!csui/controls/generic.jato.button/generic.jato.button" ], function($, _, Marionette, theming, template) {
  "use strict";
  var JatoButtonView = Marionette.ItemView.extend({
    tagName: "otc-button",
    attributes: function() {
      return {
        id: _.uniqueId(this.options.viewType),
        class: `${this.options.buttonClass} csui-acc-focusable`,
        arialabel: this.options.arialabel,
        ariaexpanded: this.options.ariaexpanded,
        ariahaspopup: this.options.ariahaspopup,
        icon: !theming.isJATOTheme() ? this.options.iconName : "",
        iconClass: this.options.iconClass,
        title: this.options.title,
        type: "subtle",
        size: theming.isJATOTheme() ? "small" : "regular"
      };
    },
    template: template,
    templateHelpers: function() {
      return {
        isJATO: theming.isJATOTheme(),
        iconSVG: this.options.iconSVG
      };
    },
    setIconStateIsOn: function(on) {
      if (on) {
        this.$el.attr("toggled", "true");
      } else {
        this.$el.removeAttr("toggled");
      }
    }
  });
  return JatoButtonView;
});