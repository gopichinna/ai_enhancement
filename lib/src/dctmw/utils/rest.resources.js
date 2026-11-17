/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  var RestResources = {
    getHomeDocLinks: function() {
      return this.homeDocLinks || [];
    },
    setHomeDocLinks: function(homeDocLinks) {
      this.homeDocLinks = homeDocLinks;
    },
    getProductInfo: function() {
      return this.productInfo || {};
    },
    setProductInfo: function(productInfo) {
      this.productInfo = productInfo;
    },
    getCurrentRepository: function() {
      return this.currentRepository || {};
    },
    setCurrentRepository: function(currentRepository) {
      this.currentRepository = currentRepository;
    },
    getCurrentUser: function() {
      return this.currentUser || {};
    },
    setCurrentUser: function(currentUser) {
      this.currentUser = currentUser;
    },
    getFormats: function() {
      return this.formats || [];
    },
    setFormats: function(formats) {
      this.formats = formats;
    },
    getD2Options: function() {
      return this.d2Options || {};
    },
    setD2Options: function(d2Options) {
      this.d2Options = d2Options;
    },
    getWigetConfigs: function() {
      return this.widgetConfigs || {};
    },
    setWidgetConfigs: function(widgetConfigs) {
      this.widgetConfigs = widgetConfigs;
    },
    getDctmTypeData: function() {
      return this.dctmTypeData || {};
    },
    setDctmTypeData: function(dctmTypeData) {
      this.dctmTypeData = dctmTypeData;
    },
    setCorePermissionRoles: function(corePermissionRoles) {
      this.corePermissionRoles = corePermissionRoles;
    },
    getCorePermissionRoles: function() {
      return this.corePermissionRoles || [];
    },
    setContentAssistConfig: function(contentAssistConfig) {
      this.contentAssistConfig = contentAssistConfig;
    },
    getContentAssistConfig: function() {
      return this.contentAssistConfig;
    }
  };
  return RestResources;
});