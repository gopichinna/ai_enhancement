/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "i18n!csui/perspective.manage/settings.panel/settings/icons.setting/impl/nls/lang" ], function(_, lang) {
  return {
    title: lang.breadcrumbs,
    schema: {
      type: "object",
      properties: {
        linkColor: {
          title: lang.linkColor,
          type: "string"
        }
      }
    },
    options: {
      fields: {
        linkColor: {
          type: "csui-color-picker"
        }
      }
    },
    getConfigFromFormData: function(formData) {
      return {
        brandingSettingCodes: {
          breadcrumbColor: formData.linkColor
        }
      };
    },
    getFormDataFromConfig: function(headerConfig) {
      return {
        linkColor: _.get(headerConfig.brandingSettingCodes, [ "breadcrumbColor" ])
      };
    },
    getDefaultConfig: function() {
      return {
        linkColor: ""
      };
    }
  };
});