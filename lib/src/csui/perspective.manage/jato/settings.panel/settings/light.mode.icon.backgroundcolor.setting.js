/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang" ], function(lang) {
  return {
    className: "csui-light-settings-panel-branding",
    title: lang.lightModeBranding,
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
          theme: "light"
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
            light: {
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
        backgroundColor: themes?.light?.customBgColor || "rgb(255, 255, 255)",
        isInvertIconColor: themes?.light?.isInvertIconColor,
        imgData: {
          brandLogoUri: themes?.light?.brandLogoUri
        }
      };
      return retObj;
    },
    getDefaultConfig: function() {
      let retObj = {
        backgroundColor: "rgb(255, 255, 255)",
        imgData: "",
        isInvertIconColor: false
      };
      return retObj;
    }
  };
});