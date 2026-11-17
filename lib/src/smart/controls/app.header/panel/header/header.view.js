/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette3", "smart/utils/smart.base", "hbs!smart/controls/app.header/panel/header/impl/header", "i18n!smart/controls/app.header/panel/impl/nls/lang", "smart/themes/theming", "smart/themes/jato.icons/smart.jato.app.header.icons" ], function($, _, Marionette, SmartBase, template, lang, theming, jatoHeaderIcons) {
  "use strict";
  const isJato = () => theming.isJATOTheme();
  let SmartPanelHeaderView = Marionette.View.extend({
    template: template,
    templateContext: function() {
      let brandingConfig = this?.options?.brandingConfig?.attributes ?? {};
      let logoSrc = this.options.otcData.logosrc ?? brandingConfig.logoSrc ?? "";
      let iconAppearance = brandingConfig?.brandingSettingCodes?.iconThemes ?? "";
      iconAppearance = iconAppearance !== "default" ? iconAppearance : "light";
      const rtlClass = SmartBase.isRTL() ? "smart-hamburger-close-rtl-btn" : "";
      let messages = {
        rtlClass: rtlClass,
        isJato: isJato(),
        actionHamburgerClose: jatoHeaderIcons.actionHamburgerClose,
        logoSrc: logoSrc,
        iconAppearance: iconAppearance,
        closeTitle: lang.closeMenuTitle,
        closeAriaLabel: lang.closeMenuTitle
      };
      return messages;
    },
    className: "smart-panel-header",
    ui: {
      collapseButton: "otc-button",
      logo: ".smart-panel-header-logo"
    },
    events: {
      keydown: "onKeyInView"
    },
    constructor: function SmartPanelHeaderView(options = {}) {
      Marionette.View.apply(this, arguments);
    },
    onRender: function() {
      this.ui.collapseButton.on("click", _.bind(this._triggerCollapse, this));
    },
    _triggerCollapse: function() {
      this.trigger("toggle");
    },
    onKeyInView: function(event) {
      let keyCode = event.keyCode;
      this.isKeyEvent = true;
      switch (keyCode) {
       case 27:
        this.trigger("toggle");
        event.preventDefault();
        event.stopPropagation();
        break;

       default:
        return;
      }
    }
  });
  return SmartPanelHeaderView;
});