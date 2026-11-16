/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang" ], function(lang) {
  return {
    title: lang.branding,
    schema: {
      type: "object",
      properties: {
        imgData: {
          title: lang.logo,
          type: "object"
        },
        backgroundColor: {
          title: lang.backgroundColor,
          type: "string"
        },
        primaryText: {
          title: "Primary text",
          type: "string"
        },
        secondaryText: {
          title: "Secondary text",
          type: "string"
        },
        versionText: {
          title: "Version text",
          type: "string"
        }
      }
    },
    options: {
      fields: {
        imgData: {
          type: "csui-image-picker"
        },
        backgroundColor: {
          type: "csui-color-picker"
        },
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
      backgroundColor,
      imgData,
      primaryText,
      secondaryText,
      versionText
    }) {
      let retObj = {
        brandingSettingCodes: {
          customBrandingBgColor: backgroundColor,
          primaryText: primaryText,
          secondaryText: secondaryText,
          versionText: versionText
        },
        brandLogoUri: imgData?.logo,
        fileDetails: imgData?.fileDetails
      };
      return retObj;
    },
    getFormDataFromConfig: function({
      brandingSettingCodes,
      brandLogoUri
    }) {
      let retObj = {
        backgroundColor: brandingSettingCodes?.customBrandingBgColor,
        imgData: {
          brandLogoUri: brandLogoUri
        },
        primaryText: brandingSettingCodes?.primaryText,
        secondaryText: brandingSettingCodes?.secondaryText,
        versionText: brandingSettingCodes?.versionText
      };
      return retObj;
    },
    getDefaultConfig: function() {
      let retObj = {
        backgroundColor: "",
        imgData: "",
        primaryText: "",
        secondaryText: "",
        versionText: ""
      };
      return retObj;
    }
  };
});