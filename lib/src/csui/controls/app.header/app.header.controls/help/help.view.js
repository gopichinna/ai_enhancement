/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/widgets/navigation.header/controls/help/help.view", "csui/utils/contexts/factories/branding.config.factory", "i18n!csui/controls/app.header/app.header.controls/help/impl/nls/localized.strings" ], function(_, $, HelpView, BrandingConfigFactory, localizedStrings) {
  "use strict";
  var HelpViewV2 = HelpView.extend({
    template: false,
    constructor: function HelpViewV2(options) {
      HelpView.call(this, options);
      this.brandingConfigData = this.options.context.getModel(BrandingConfigFactory);
      this.otcData = {
        icon: "csui_header:csui_li_header_help42",
        title: localizedStrings.HelpIconTitle,
        arialabel: localizedStrings.HelpIconAria,
        overflowValue: localizedStrings.HelpIconTitle
      };
      this.updateData();
      this.listenTo(this.brandingConfigData, "change:branding", this.updateData);
    },
    onShow: function() {
      var self = this;
      this.el.setAttribute("tabindex", -1);
      this.options?.otcEl?.addEventListener("click", _.bind(this._onClick, this));
      $(this.options.otcEl).on("keydown", function(event) {
        if (event.keyCode === 32 || event.keyCode === 13) {
          event.preventDefault();
          self.triggerMethod("click:help");
        }
      });
    },
    updateData: function() {
      let iconTheme = this.options?.context?.previewBranding?.get("brandingSettingCodes")?.iconThemes ?? this.brandingConfigData?.get("brandingSettingCodes")?.iconThemes ?? "default";
      this.otcData = _.extend(this.otcData, {
        iconappearance: iconTheme
      });
      this.trigger("data:synced");
    }
  });
  return HelpViewV2;
});