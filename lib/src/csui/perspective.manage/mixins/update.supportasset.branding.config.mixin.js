/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/contexts/factories/connector", "csui/models/node/node.model", "csui/utils/url", "csui/utils/commonconfig.util", "smart/themes/theming" ], function(_, $, ConnectorFactory, NodeModel, Url, CommonConfigUtil, theming) {
  "use strict";
  const isJato = () => theming.isJATOTheme();
  const UpdateSupportAssetBrandingConfigMixin = {
    mixin: function(prototype) {
      const prefix = "[data-smart-theme] .binf-widgets ";
      return _.extend(prototype, {
        output: {},
        BRANDING_CONFIG_STYLESHEET_NAME: "BRANDINGCONFIG_CSS_FILE.css",
        PREVIEW_BRANDING_CONFIG_STYLESHEET_NAME: "PREVIEWBRANDINGCONFIG_CSS_FILE.css",
        PREVIEW_JATO_BRANDING_CONFIG_STYLESHEET_NAME: "PREVIEWJATOBRANDINGCONFIG_CSS_FILE.css",
        BRANDING_CONFIG: {
          FOLDER_NAME: "Branding Config",
          FOLDER_TYPE_NAME: "Support Asset Image Folder",
          FOLDER_TYPE: 1306
        },
        JATO_LIGHT_BRANDING_CONFIG: {
          FOLDER_NAME: "Branding Config Jato Light",
          FOLDER_TYPE_NAME: "Support Asset Image Folder",
          FOLDER_TYPE: 1306
        },
        JATO_DARK_BRANDING_CONFIG: {
          FOLDER_NAME: "Branding Config Jato Dark",
          FOLDER_TYPE_NAME: "Support Asset Image Folder",
          FOLDER_TYPE: 1306
        },
        SUB_TYPE: 1309,
        IMG_NO_UPLOAD: "No Img Uploaded",
        CSS_NO_UPLOAD: "No style modified",
        SUCCESS: "success",
        ERROR: "error",
        SUCCESS_WITHOUT_CSS: "success without CSS",
        NO_RESULT_FOUND: "no result found",
        brandingStylesheet: `  
            :root {
              --jatx-body-background-color: [CUSTOM_BRANDING_BGCOLOR];
            }
            ${prefix} .csui-image-picker .csui-brand-image-logo {
              --jatx-body-background-color: [CUSTOM_BRANDING_BGCOLOR];
            }
            ${prefix} .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #content-region, 
            ${prefix} .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #sidebar-region,
            ${prefix} .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #main{
              background: [CUSTOM_BRANDING_BGCOLOR];
            }
        `,
        jatoBrandingStylesheet: `
            ${prefix} .csui-dark-settings-panel-branding .csui-image-picker .csui-brand-image-logo{
              background: [CUSTOM_DARK_BRANDING_BGCOLOR];
            }
            ${prefix} .csui-light-settings-panel-branding .csui-image-picker .csui-brand-image-logo{
              background: [CUSTOM_LIGHT_BRANDING_BGCOLOR];
            }
            ${prefix} .pman-dark-header-container .smart-app-header-wrapper otc-header-bar {
              --jatx-smart-app-header-bg-color: [CUSTOM_DARK_BRANDING_BGCOLOR];
              [JATO_DARK_APP_HEADER_HEIGHT_BORDER_BOTTOM]
            }
            ${prefix} .pman-light-header-container .smart-app-header-wrapper otc-header-bar {
              --jatx-smart-app-header-bg-color: [CUSTOM_LIGHT_BRANDING_BGCOLOR];
              [JATO_LIGHT_APP_HEADER_HEIGHT_BORDER_BOTTOM]
            }
          `,
        DEFAULT_BRAND_SETTINGS: {
          primaryText: "",
          secondaryText: "",
          versionText: "",
          iconThemes: "default",
          themes: {
            light: {
              brandLogoUri: "",
              customBgColor: "",
              breadcrumbColor: "",
              isInvertIconColor: false
            },
            dark: {
              brandLogoUri: "",
              customBgColor: "",
              breadcrumbColor: "",
              isInvertIconColor: false
            }
          },
          breadcrumbColor: "",
          customBrandingBgColor: ""
        },
        LANDING_PAGE_BGCOLOR_JATO: "transparent",
        getSupportAssetVolumeID: function() {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const deferred = $.Deferred();
          const data = {
            url: `${connector.getConnectionUrl().getApiBase()}volumes/${this.SUB_TYPE}`
          };
          connector.makeAjaxCall(data).then(response => {
            return deferred.resolve(response);
          }).fail(function(error) {
            return deferred.reject(error);
          });
          return deferred.promise();
        },
        fetchBrandingConfigFolderDetails: function(supportasset, imgFile, isBrandLogoUriPresent) {
          let deferred = $.Deferred();
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            url: `${connector.getConnectionUrl().getApiBase("v2")}app/container/${supportasset.id}`
          };
          connector.makeAjaxCall(data).then(response => {
            const brandingConfig = Array.isArray(response.results.contents) && response.results.contents.filter(items => items.name === this.BRANDING_CONFIG.FOLDER_NAME);
            if (brandingConfig.length > 0) {
              const {
                id
              } = brandingConfig[0];
              if (id) {
                this.getItemsFromNode(id).done(response => {
                  const contents = response.results?.contents;
                  this.deleteItemsFromBranding(contents, imgFile, isBrandLogoUriPresent).done(() => {
                    return deferred.resolve(brandingConfig[0]);
                  }).fail(error => {
                    return deferred.reject(error);
                  });
                }).fail(error => {
                  return deferred.reject(error);
                });
              } else {
                return deferred.resolve(brandingConfig[0]);
              }
            } else {
              this.createBrandingConfigFolder(supportasset).done(response => {
                return deferred.resolve(response);
              });
            }
          }).fail(function(error) {
            return deferred.reject(error);
          });
          return deferred.promise();
        },
        getItemsFromNode: function(nodeID) {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            url: `${connector.getConnectionUrl().getApiBase("v2")}app/container/${nodeID}`
          };
          return connector.makeAjaxCall(data);
        },
        getDetailsForBrandingConfig: function() {
          let deferred = $.Deferred();
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            url: `${connector.getConnectionUrl().getApiBase("v2")}server/settings/branding`
          };
          connector.makeAjaxCall(data).then(response => {
            if (response?.results?.value) {
              try {
                const brandingData = response.results.value;
                if (brandingData.brandLogoUri) {
                  brandingData.brandLogoUri = `${connector.getConnectionUrl().getOrigin()}${brandingData.brandLogoUri}`;
                }
                let themes = brandingData?.brandingSettingCodes?.themes;
                if (themes && Object.keys(themes).length > 0) {
                  for (let theme in themes) {
                    let brandLogoUriJatoTheme = themes[theme]?.brandLogoUri;
                    if (brandLogoUriJatoTheme && CommonConfigUtil.enableJatoBranding()) {
                      brandingData.brandingSettingCodes.themes[theme].brandLogoUri = `${connector.getConnectionUrl().getOrigin()}${brandLogoUriJatoTheme}`;
                    }
                  }
                }
                return deferred.resolve({
                  statusMsg: this.SUCCESS,
                  data: brandingData
                });
              } catch (error) {
                return deferred.reject({
                  statusMsg: this.ERROR
                });
              }
            } else {
              return deferred.reject({
                statusMsg: this.ERROR
              });
            }
          }).fail(function(error) {
            return deferred.reject(error);
          });
          return deferred.promise();
        },
        deleteItemsFromBranding: function(contents, imgFile, isBrandLogoUriPresent) {
          let deferred = $.Deferred();
          if ((contents.length === 0 || isBrandLogoUriPresent) && !imgFile) return deferred.resolve({
            statusMsg: "Nothing to be deleted"
          });
          let deferreds = [];
          let IDs = [];
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          IDs = contents.map(item => item.id);
          IDs.forEach(id => {
            deferreds.push(deferred);
            const data = {
              method: "DELETE",
              url: `${connector.getConnectionUrl().getApiBase()}nodes/${id}`
            };
            connector.makeAjaxCall(data).then(response => {
              return deferred.resolve(response);
            }).fail(function(error) {
              return deferred.reject(error);
            });
          });
          return $.whenAll.apply($, deferreds);
        },
        createBrandingConfigFolder: function({
          id,
          container
        }) {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          let deferred = $.Deferred();
          const postData = {
            type: this.BRANDING_CONFIG.FOLDER_TYPE,
            type_name: this.BRANDING_CONFIG.FOLDER_TYPE_NAME,
            container: container,
            name: this.BRANDING_CONFIG.FOLDER_NAME,
            parent_id: id
          };
          const data = {
            method: "POST",
            url: `${connector.getConnectionUrl().getApiBase()}nodes`,
            data: postData
          };
          connector.makeAjaxCall(data).then(response => {
            return deferred.resolve(response);
          }).fail(function(error) {
            return deferred.reject(error);
          });
          return deferred.promise();
        },
        uploadConfigInBrandingFolder: function(imgFile, res) {
          let deferred = $.Deferred();
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          if (!imgFile || !res || !(imgFile instanceof File)) return deferred.resolve({
            statusMsg: this.IMG_NO_UPLOAD
          });
          const node = new NodeModel({
            type: 144
          }, {
            connector: connector
          });
          return node.save({
            name: imgFile.name,
            type: 1305,
            parent_id: res.id,
            advanced_versioning: false
          }, {
            files: {
              file: imgFile
            }
          });
        },
        getBlodURL: function(blob) {
          if (!blob || !(blob instanceof Blob)) return;
          const blobImgUrl = URL.createObjectURL(blob);
          return blobImgUrl;
        },
        uploadBrandingConfigSettings: function(postData) {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const deferred = $.Deferred();
          const data = {
            method: "POST",
            url: `${connector.getConnectionUrl().getApiBase("v2")}server/settings/branding`,
            data: {
              value: JSON.stringify(postData)
            }
          };
          connector.makeAjaxCall(data).done(response => {
            return deferred.resolve(response);
          }).fail(error => {
            return deferred.reject(error);
          });
          return deferred.promise();
        },
        getNodeDetails: function(nodeID) {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            url: `${connector.getConnectionUrl().getApiBase("v2")}/nodes/${nodeID}/nodes?fields=properties`
          };
          return connector.makeAjaxCall(data);
        },
        getFileDetails: function(id) {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          var cgiUrl = new Url(connector.connection.url).getCgiScript();
          const url = `${cgiUrl}?func=doc.fetchcsui&nodeid=${id}`;
          const data = {
            url: url,
            dataType: "binary"
          };
          return connector.makeAjaxCall(data);
        },
        applyCFPreviewBrandingStyleSheet: function({
          brandingSettingCodes
        }) {
          const {
            customBrandingBgColor
          } = brandingSettingCodes;
          const regex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
          let tempbrandingStylesheet = this.brandingStylesheet.trim();
          if (regex.test(customBrandingBgColor)) {
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll("[CUSTOM_BRANDING_BGCOLOR]", customBrandingBgColor);
            const brandingConfigCSSUri = URL.createObjectURL(new Blob([ tempbrandingStylesheet ], {
              type: "text/css",
              name: this.PREVIEW_BRANDING_CONFIG_STYLESHEET_NAME
            }));
            this.removeStyleSheetAndAddNewOne("preview-branding-stylesheet", brandingConfigCSSUri, tempbrandingStylesheet);
          }
        },
        applyJatoPreviewBrandingStyleSheet: function({
          brandingSettingCodes
        }) {
          const themes = brandingSettingCodes?.themes;
          const regex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
          let tempbrandingStylesheet = this.jatoBrandingStylesheet.trim();
          if (themes && !Object.keys(themes)?.length) return;
          for (let theme in themes) {
            let themeObj = themes[theme];
            let {
              customBgColor
            } = themeObj;
            let appHeaderHeightBorderBottom = "";
            if (regex.test(customBgColor)) {
              appHeaderHeightBorderBottom = `\n
              --otc-header-bottom-border: none;
              border-bottom: 2px solid ${customBgColor};
              `;
              tempbrandingStylesheet = tempbrandingStylesheet.replaceAll(`[CUSTOM_${theme.toUpperCase()}_BRANDING_BGCOLOR]`, customBgColor);
            } else {
              tempbrandingStylesheet = tempbrandingStylesheet.replaceAll(`[CUSTOM_${theme.toUpperCase()}_BRANDING_BGCOLOR]`, "var(--jato-background-elevation-level-1, transparent)");
            }
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll(`[JATO_${theme.toUpperCase()}_APP_HEADER_HEIGHT_BORDER_BOTTOM]`, appHeaderHeightBorderBottom);
          }
          const brandingConfigCSSUri = URL.createObjectURL(new Blob([ tempbrandingStylesheet ], {
            type: "text/css",
            name: this.PREVIEW_JATO_BRANDING_CONFIG_STYLESHEET_NAME
          }));
          this.removeStyleSheetAndAddNewOne("preview-jato-branding-stylesheet", brandingConfigCSSUri, tempbrandingStylesheet);
        },
        removeStyleSheetAndAddNewOne: function(id, cssuri, brandingSS) {
          let highContrast = matchMedia("(forced-colors: active)");
          if (!highContrast?.matches && brandingSS) {
            document.getElementById(id)?.remove();
            const link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            link.href = cssuri;
            $(".pman-mode-edit").append(link);
          }
        },
        removePreviewBrandingStyleSheet: function() {
          const stylesheetIDCF = "preview-branding-stylesheet";
          const stylesheetIDJATO = "preview-jato-branding-stylesheet";
          document.getElementById(stylesheetIDCF)?.remove();
          document.getElementById(stylesheetIDJATO)?.remove();
        },
        createStyleSheet: function(brandingSettingCodes) {
          if (!brandingSettingCodes) return;
          const {
            customBrandingBgColor
          } = brandingSettingCodes;
          let tempbrandingStylesheet = this.brandingStylesheet.trim();
          const regex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
          if (regex.test(customBrandingBgColor)) {
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll("[CUSTOM_BRANDING_BGCOLOR]", customBrandingBgColor);
          } else {
            tempbrandingStylesheet = "";
          }
          const brandingConfigCSSUri = URL.createObjectURL(new Blob([ tempbrandingStylesheet ], {
            type: "text/css",
            name: this.BRANDING_CONFIG_STYLESHEET_NAME
          }));
          let highContrast = matchMedia("(forced-colors: active)");
          if (!highContrast?.matches) return brandingConfigCSSUri;
        },
        fetchBrandingConfigFolderDetailsJato: function(supportasset, imgFile, isBrandLogoUriPresent, theme) {
          let deferred = $.Deferred();
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            url: `${connector.getConnectionUrl().getApiBase("v2")}app/container/${supportasset.id}`
          };
          connector.makeAjaxCall(data).then(response => {
            const brandingConfig = Array.isArray(response.results.contents) && response.results.contents.filter(items => items.name === this[`JATO_${theme.toUpperCase()}_BRANDING_CONFIG`].FOLDER_NAME);
            if (brandingConfig.length > 0) {
              const {
                id
              } = brandingConfig[0];
              if (id) {
                this.getItemsFromNode(id).done(response => {
                  const contents = response.results?.contents;
                  this.deleteItemsFromBranding(contents, imgFile, isBrandLogoUriPresent).done(() => {
                    return deferred.resolve(brandingConfig[0]);
                  }).fail(error => {
                    return deferred.reject(error);
                  });
                }).fail(error => {
                  return deferred.reject(error);
                });
              } else {
                return deferred.resolve(brandingConfig[0]);
              }
            } else {
              this.createBrandingConfigFolderJato(supportasset, theme).done(response => {
                return deferred.resolve(response);
              });
            }
          }).fail(function(error) {
            return deferred.reject(error);
          });
          return deferred.promise();
        },
        createBrandingConfigFolderJato: function({
          id,
          container
        }, theme) {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          let brandingConfig = this[`JATO_${theme.toUpperCase()}_BRANDING_CONFIG`];
          let deferred = $.Deferred();
          const postData = {
            type: brandingConfig.FOLDER_TYPE,
            type_name: brandingConfig.FOLDER_TYPE_NAME,
            container: container,
            name: brandingConfig.FOLDER_NAME,
            parent_id: id
          };
          const data = {
            method: "POST",
            url: `${connector.getConnectionUrl().getApiBase()}nodes`,
            data: postData
          };
          connector.makeAjaxCall(data).then(response => {
            return deferred.resolve(response);
          }).fail(function(error) {
            return deferred.reject(error);
          });
          return deferred.promise();
        },
        createStyleSheetForJatoTheme: function(brandingSettingCodes) {
          const themes = brandingSettingCodes?.themes;
          const currentTheme = theming.getTheme();
          const regex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
          let tempbrandingStylesheet = this.jatoBrandingStylesheet.trim();
          if (themes && !Object.keys(themes)?.length) return;
          for (let theme in themes) {
            let appHeaderHeightBorderBottom = "";
            let themeObj = themes[theme];
            let {
              customBgColor
            } = themeObj;
            if (regex.test(customBgColor)) {
              appHeaderHeightBorderBottom = `\n
              --otc-header-bottom-border: none;
              border-bottom: 2px solid ${customBgColor};
              `;
              tempbrandingStylesheet = tempbrandingStylesheet.replaceAll(`[CUSTOM_${theme.toUpperCase()}_BRANDING_BGCOLOR]`, customBgColor);
            } else {
              appHeaderHeightBorderBottom = "";
              tempbrandingStylesheet = tempbrandingStylesheet.replaceAll(`[CUSTOM_${theme.toUpperCase()}_BRANDING_BGCOLOR]`, "var(--jato-background-elevation-level-1, transparent)");
            }
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll(`[JATO_${theme.toUpperCase()}_APP_HEADER_HEIGHT_BORDER_BOTTOM]`, appHeaderHeightBorderBottom);
          }
          let {
            customBgColor
          } = themes[currentTheme];
          let appHeaderHeightBorderBottom = `\n
            --otc-header-bottom-border: none;
            border-bottom: 2px solid ${customBgColor};
            `;
          if (regex.test(customBgColor)) {
            let headerBrandingStyleSheet = `
            :root {
              --jatx-smart-app-header-bg-color: ${customBgColor};
            }\n
            body > .smart-app-header-wrapper > otc-header-bar {
              ${appHeaderHeightBorderBottom}
            }
            `;
            tempbrandingStylesheet = headerBrandingStyleSheet + tempbrandingStylesheet;
          }
          const brandingConfigCSSUri = URL.createObjectURL(new Blob([ tempbrandingStylesheet ], {
            type: "text/css",
            name: this.BRANDING_CONFIG_STYLESHEET_NAME
          }));
          let highContrast = matchMedia("(forced-colors: active)");
          if (!highContrast?.matches) return brandingConfigCSSUri;
        },
        getJatoThemeBrandingLogo: function(theme, previewBrandingAttributes) {
          if (!theme) return;
          let themes = previewBrandingAttributes?.brandingSettingCodes?.themes;
          if (themes) {
            let {
              brandLogoUri,
              fileDetails
            } = themes[theme];
            return {
              brandLogoUri: brandLogoUri,
              fileDetails: fileDetails
            };
          }
        },
        rgbStringToHex: function(rgbString) {
          const result = rgbString.match(/\d+/g);
          if (!result || result.length !== 3) {
            return;
          }
          const [ r, g, b ] = result.map(Number);
          return "#" + [ r, g, b ].map(x => x.toString(16).padStart(2, "0")).join("");
        }
      });
    }
  };
  return UpdateSupportAssetBrandingConfigMixin;
});