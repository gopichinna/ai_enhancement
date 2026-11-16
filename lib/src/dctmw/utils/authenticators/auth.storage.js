/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/utils", "dctmw/utils/constants" ], function(_, utils, constants) {
  "use strict";
  var AUTH_TABS = "authTabs", TAB_ID = "tabId", authData = utils.getLocalStore(constants.StorageKey.AUTH_DATA), sessionData = utils.getSessionStore(constants.StorageKey.AUTH_TABS), repoSessionData = utils.getSessionStore(constants.StorageKey.REPO_DATA);
  return {
    getAllTabsData: function() {
      return authData.get(AUTH_TABS) || {};
    },
    setAllTabsData: function(data) {
      return authData.set(AUTH_TABS, data);
    },
    getCurrTabData: function() {
      var currTabId = this.getCurrTabId(), tabsData = this.getAllTabsData();
      return tabsData[currTabId] || {};
    },
    setCurrTabData: function(data) {
      var currTabId = this.getCurrTabId(), tabsData = this.getAllTabsData();
      tabsData[currTabId] = data;
      authData.set(AUTH_TABS, tabsData);
    },
    removeCurrTabData: function() {
      var currTabId = this.getCurrTabId(), tabsData = this.getAllTabsData();
      delete tabsData[currTabId];
      authData.set(AUTH_TABS, tabsData);
    },
    getCurrTabId: function() {
      var tabId = sessionData.get(TAB_ID);
      if (!tabId) {
        tabId = new Date().getTime() + "-" + Math.floor(Math.random() * 1e3);
        this._setCurrTabId(tabId);
      }
      return tabId;
    },
    _setCurrTabId: function(tabId) {
      sessionData.set(TAB_ID, tabId);
    },
    setAuthRepoData: function(repo, data) {
      repoSessionData.set(repo, data);
    },
    getAuthRepoData: function(repo) {
      var repoDataValue = repoSessionData.get(repo) || {};
      return repoDataValue;
    },
    removeAuthRepoData: function(repo) {
      repoSessionData.remove(repo);
    }
  };
});