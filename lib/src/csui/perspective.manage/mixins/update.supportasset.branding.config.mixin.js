/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/utils/contexts/factories/connector", "csui/models/node/node.model", "csui/utils/url" ], function(_, $, ConnectorFactory, NodeModel, Url) {
  "use strict";
  const UpdateSupportAssetBrandingConfigMixin = {
    mixin: function(prototype) {
      return _.extend(prototype, {
        output: {},
        BRANDING_CONFIG_STYLESHEET_NAME: "BRANDINGCONFIG_CSS_FILE.css",
        BRANDING_CONFIG: {
          FOLDER_NAME: "Branding Config",
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
            .binf-widgets,
            .binf-widgets .csui-navbar.binf-navbar, 
            .binf-widgets.csui-pman-header-config .pman-header-preview-panel,
            .binf-widgets #breadcrumb-wrap .csui-perspective-breadcrumb,
            .binf-widgets #breadcrumb-wrap .breadcrumb-inner.breadcrumb-inner-header,        
            .binf-widgets .csui-perspective-breadcrumb,
            .binf-widgets .csui-image-picker .csui-brand-image-logo {
              background: [CUSTOM_BRANDING_BGCOLOR];
            }
            .binf-widgets .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #content-region, .binf-widgets .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #sidebar-region{
              background: [LANDING_PAGE_BGCOLOR];
            }
            .binf-widgets .csui-perspective-view .banner-content-sidebar-perspective.cs-perspective #main{
              background-color: [LANDING_PAGE_BGCOLOR];
            }
        `,
        getSupportAssetVolumeID: function() {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            url: `${connector.getConnectionUrl().getApiBase()}volumes/${this.SUB_TYPE}`
          };
          return connector.makeAjaxCall(data);
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
                size,
                id
              } = brandingConfig[0];
              if (size > 0) {
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
          if (!imgFile || !res || !imgFile instanceof File) return deferred.resolve({
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
          if (!blob || !blob instanceof Blob) return;
          const blobImgUrl = URL.createObjectURL(blob);
          return blobImgUrl;
        },
        uploadBrandingConfigSettings: function(postData) {
          const context = this.context || this.options.context;
          const connector = context.getObject(ConnectorFactory);
          const data = {
            method: "POST",
            url: `${connector.getConnectionUrl().getApiBase("v2")}server/settings/branding`,
            data: {
              value: JSON.stringify(postData)
            }
          };
          return connector.makeAjaxCall(data);
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
        createStyleSheet: function(brandingSettingCodes) {
          if (!brandingSettingCodes) return;
          const {
            customBrandingBgColor,
            breadcrumbColor
          } = brandingSettingCodes;
          let tempbrandingStylesheet = this.brandingStylesheet.trim();
          const regex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
          if (regex.test(customBrandingBgColor)) {
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll("[CUSTOM_BRANDING_BGCOLOR]", customBrandingBgColor);
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll("[LANDING_PAGE_BGCOLOR]", customBrandingBgColor);
          }
          if (regex.test(customBrandingBgColor)) {
            tempbrandingStylesheet = tempbrandingStylesheet.replaceAll("[BREADCRUMB_COLOR]", breadcrumbColor);
          }
          const brandingConfigCSSUri = URL.createObjectURL(new Blob([ tempbrandingStylesheet ], {
            type: "text/css",
            name: this.BRANDING_CONFIG_STYLESHEET_NAME
          }));
          let highContrast = matchMedia("(forced-colors: active)");
          if (!highContrast?.matches) return brandingConfigCSSUri;
        }
      });
    }
  };
  return UpdateSupportAssetBrandingConfigMixin;
});