/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/perspective.manage/settings.panel/settings/icons.setting/icons.setting.view", "i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang" ], function(_, IconSettingsView, lang) {
  return {
    title: lang.icons,
    view: IconSettingsView,
    getConfigFromFormData: function(iconData) {
      return {
        brandingSettingCodes: {
          iconThemes: iconData.theme || "default"
        }
      };
    },
    getFormDataFromConfig: function(headerConfig) {
      return {
        linkColor: _.get(headerConfig.brandingSettingCodes, [ "iconThemes" ]) || {}
      };
    },
    getDefaultConfig: function() {
      return {
        brandingSettingCodes: {
          iconThemes: "default"
        }
      };
    }
  };
});