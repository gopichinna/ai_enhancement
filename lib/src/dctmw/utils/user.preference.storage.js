/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/utils", "dctmw/utils/constants", "dctmw/utils/rest.resources" ], function(_, utils, constants, RestResources) {
  "use strict";
  var KEY_ALL_VERSION_DISPLAY_STATUS_FOR_DOCLIST = "isAllVersionShownForDoclist", KEY_ALL_VERSION_DISPLAY_STATUS_FOR_FAV = "isAllVersionShownForFavorites";
  var StorageTypes = Object.freeze({
    FACET_PANEL_VISIBILITY: "FacetPanelVisibility",
    SEARCH_PANEL_VISIBILITY: "SearchPanelVisibility",
    PRIMARY_PANE_WIDTH: "PrimaryPaneWidth",
    MINIVIEWER_VISIBLITY: "MiniViewerVisiblity"
  });
  var pageSizeStorage = utils.getLocalStore("DoclistPref"), sessionPrefStore, localPrefStore;
  var checkKey = function(key) {
    return key === KEY_ALL_VERSION_DISPLAY_STATUS_FOR_DOCLIST || key === KEY_ALL_VERSION_DISPLAY_STATUS_FOR_FAV;
  };
  function getSessionPrefStore() {
    var storeName = constants.StorageKey.USER_PREFERENCE_STORE + ":" + RestResources.getCurrentUser().get("name");
    if (!sessionPrefStore || sessionPrefStore.name !== storeName) {
      sessionPrefStore = utils.getSessionStore(storeName);
    }
    return sessionPrefStore;
  }
  function getLocalPrefStore() {
    var storeName = constants.StorageKey.TABLES_USER_PREFERENCE_STORE + ":" + RestResources.getCurrentUser().get("name");
    if (!localPrefStore || localPrefStore.name !== storeName) {
      localPrefStore = utils.getLocalStore(storeName);
    }
    return localPrefStore;
  }
  function getSubStorePreference(store, subStoreName, preferenceKey) {
    var subStore = store.get(subStoreName) || {};
    return subStore[preferenceKey];
  }
  function saveSubStorePreference(store, subStoreName, preferenceKey, preferenceValue) {
    var subStore = store.get(subStoreName) || {};
    subStore[preferenceKey] = preferenceValue;
    return store.set(subStoreName, subStore);
  }
  function removeSubStorePreference(store, subStoreName, preferenceKey) {
    var subStore = store.get(subStoreName) || {};
    delete subStore[preferenceKey];
    return store.set(subStoreName, subStore);
  }
  return {
    KEY_ALL_VERSION_DISPLAY_STATUS_FOR_DOCLIST: KEY_ALL_VERSION_DISPLAY_STATUS_FOR_DOCLIST,
    KEY_ALL_VERSION_DISPLAY_STATUS_FOR_FAV: KEY_ALL_VERSION_DISPLAY_STATUS_FOR_FAV,
    StorageTypes: StorageTypes,
    isAllVersionShownForDoclist: function() {
      return getSessionPrefStore().get(KEY_ALL_VERSION_DISPLAY_STATUS_FOR_DOCLIST) || false;
    },
    setAllVersionStatusForDoclist: function(isShown) {
      getSessionPrefStore().set(KEY_ALL_VERSION_DISPLAY_STATUS_FOR_DOCLIST, !!isShown);
    },
    isAllVersionShownForFavorites: function() {
      return _.isUndefined(getSessionPrefStore().get(KEY_ALL_VERSION_DISPLAY_STATUS_FOR_FAV)) ? true : getSessionPrefStore().get(KEY_ALL_VERSION_DISPLAY_STATUS_FOR_FAV);
    },
    setAllVersionStatusForFavorites: function(isShown) {
      getSessionPrefStore().set(KEY_ALL_VERSION_DISPLAY_STATUS_FOR_FAV, !!isShown);
    },
    isAllVersionShown: function(key) {
      if (key === KEY_ALL_VERSION_DISPLAY_STATUS_FOR_FAV) {
        return this.isAllVersionShownForFavorites();
      }
      return checkKey(key) && getSessionPrefStore().get(key) || false;
    },
    setAllVersionStatus: function(key, isShown) {
      checkKey(key) && getSessionPrefStore().set(key, !!isShown);
    },
    fetchPageSize: function(containerId) {
      var pageSizes = pageSizeStorage.get("pageSize") || {}, pageSize;
      if (containerId) {
        pageSize = _.findKey(pageSizes, function(ids) {
          return _.contains(ids, containerId);
        });
        if (pageSize && !!Number(pageSize)) {
          return Number(pageSize);
        }
      }
      return undefined;
    },
    savePageSize: function(containerId, size) {
      var pageSizes = pageSizeStorage.get("pageSize");
      if (containerId) {
        if (!pageSizes) {
          pageSizes = {};
          pageSizes[size] = [ containerId ];
        } else {
          var pageSize = _.findKey(pageSizes, function(ids) {
            return _.contains(ids, containerId);
          });
          if (pageSize && pageSize !== size) {
            pageSizes[pageSize] = _.without(pageSizes[pageSize], containerId);
          }
          var ids = pageSizes[size] || [];
          !_.contains(ids, containerId) && ids.push(containerId);
          pageSizes[size] = ids;
        }
        pageSizeStorage.set("pageSize", pageSizes);
      }
    },
    getLocalStorePreference: function(subStoreName, preferenceKey) {
      return getSubStorePreference(getLocalPrefStore(), subStoreName, preferenceKey);
    },
    saveLocalStorePreference: function(subStoreName, preferenceKey, preferenceValue) {
      return saveSubStorePreference(getLocalPrefStore(), subStoreName, preferenceKey, preferenceValue);
    },
    removeLocalStorePreference: function(subStoreName, preferenceKey) {
      return removeSubStorePreference(getLocalPrefStore(), subStoreName, preferenceKey);
    },
    getSessionStorePreference: function(subStoreName, preferenceKey) {
      return getSubStorePreference(getSessionPrefStore(), subStoreName, preferenceKey);
    },
    saveSessionStorePreference: function(subStoreName, preferenceKey, preferenceValue) {
      return saveSubStorePreference(getSessionPrefStore(), subStoreName, preferenceKey, preferenceValue);
    },
    removeSessionStorePreference: function(subStoreName, preferenceKey) {
      return removeSubStorePreference(getSessionPrefStore(), subStoreName, preferenceKey);
    },
    getTablePreferenceStorageIdForWidget: function(widgetType, widgetName) {
      return utils.getStoreKey() + ":" + constants.StorageKey.TABLES_USER_PREFERENCE_STORE + ":" + widgetType + ":" + widgetName + ":" + RestResources.getCurrentUser().get("name") + ":" + RestResources.getCurrentRepository().get("name");
    }
  };
});