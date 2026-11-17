/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang" ], function(lang) {
  return {
    className: "csui-dark-settings-panel-branding",
    title: lang.darkModeBranding,
    schema: {
      type: "object",
      properties: {
        imgData: {
          title: lang.logo,
          type: "object"
        },
        backgroundColor: {
          title: lang.applicationHeaderBackgroundColor,
          type: "string"
        },
        isInvertIconColor: {
          title: lang.invertIconColors,
          type: "checkboxV2"
        }
      }
    },
    options: {
      fields: {
        imgData: {
          type: "csui-image-picker",
          theme: "dark"
        },
        backgroundColor: {
          type: "csui-color-picker"
        },
        isInvertIconColor: {
          type: "checkboxV2"
        }
      }
    },
    getConfigFromFormData: function({
      backgroundColor,
      imgData,
      isInvertIconColor
    }) {
      let retObj = {
        brandingSettingCodes: {
          themes: {
            dark: {
              customBrandingBgColor: backgroundColor,
              brandLogoUri: imgData?.logo,
              isInvertIconColor: isInvertIconColor,
              fileDetails: imgData?.fileDetails
            }
          }
        }
      };
      return retObj;
    },
    getFormDataFromConfig: function({
      brandingSettingCodes
    }) {
      let themes = brandingSettingCodes?.themes;
      let retObj = {
        backgroundColor: themes?.dark?.customBgColor || "rgb(20, 27, 46)",
        imgData: {
          brandLogoUri: themes?.dark?.brandLogoUri
        },
        isInvertIconColor: themes?.dark?.isInvertIconColor
      };
      return retObj;
    },
    getDefaultConfig: function() {
      let retObj = {
        backgroundColor: "rgb(20, 27, 46)",
        isInvertIconColor: false,
        imgData: ""
      };
      return retObj;
    }
  };
});