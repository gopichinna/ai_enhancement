/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang" ], function(lang) {
  return {
    className: "csui-settings-panel-branding-product-name",
    title: lang.text,
    schema: {
      type: "object",
      properties: {
        primaryText: {
          title: lang.primaryText,
          type: "string"
        },
        secondaryText: {
          title: lang.secondaryText,
          type: "string"
        },
        versionText: {
          title: lang.versionText,
          type: "string"
        }
      }
    },
    options: {
      fields: {
        primaryText: {
          type: "text"
        },
        secondaryText: {
          type: "text"
        },
        versionText: {
          type: "text"
        }
      }
    },
    getConfigFromFormData: function({
      primaryText,
      secondaryText,
      versionText
    }) {
      let retObj = {
        brandingSettingCodes: {
          primaryText: primaryText,
          secondaryText: secondaryText,
          versionText: versionText
        }
      };
      return retObj;
    },
    getFormDataFromConfig: function({
      brandingSettingCodes
    }) {
      let retObj = {
        primaryText: brandingSettingCodes?.primaryText,
        secondaryText: brandingSettingCodes?.secondaryText,
        versionText: brandingSettingCodes?.versionText
      };
      return retObj;
    },
    getDefaultConfig: function() {
      let retObj = {
        primaryText: "",
        secondaryText: "",
        versionText: ""
      };
      return retObj;
    }
  };
});