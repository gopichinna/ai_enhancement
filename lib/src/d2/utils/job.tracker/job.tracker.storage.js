/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/utils/utils", "dctmw/utils/constants", "dctmw/utils/rest.resources" ], function(_, utils, constants, RestResources) {
  "use strict";
  var sessionPrefStore;
  var StorageTypes = Object.freeze({
    TRACKER_OBJECTS: "TrackerObjects"
  });
  function getSessionPrefStore() {
    var storeName = constants.StorageKey.JOB_TRACKER + ":" + RestResources.getCurrentUser().get("name");
    if (!sessionPrefStore || sessionPrefStore.name !== storeName) {
      sessionPrefStore = utils.getSessionStore(storeName);
    }
    return sessionPrefStore;
  }
  function getSubStoreTrackers(store, subStoreName, preferenceKey) {
    var subStore = store.get(subStoreName) || {};
    return subStore[preferenceKey];
  }
  function getSubStoreAllTrackers(store, subStoreName) {
    var subStore = store.get(subStoreName) || {};
    return subStore;
  }
  function saveSubStoreTrackers(store, subStoreName, preferenceKey, preferenceValue) {
    var subStore = store.get(subStoreName) || {};
    subStore[preferenceKey] = preferenceValue;
    return store.set(subStoreName, subStore);
  }
  function removeSubStoreTrackers(store, subStoreName, preferenceKey) {
    var subStore = store.get(subStoreName) || {};
    delete subStore[preferenceKey];
    return store.set(subStoreName, subStore);
  }
  return {
    getAllSessionStoreTrackers: function() {
      return getSubStoreAllTrackers(getSessionPrefStore(), StorageTypes.TRACKER_OBJECTS);
    },
    getSessionStoreTrackers: function(trackerId) {
      return getSubStoreTrackers(getSessionPrefStore(), StorageTypes.TRACKER_OBJECTS, trackerId);
    },
    saveSessionStoreTrackers: function(trackerId, trackerValue) {
      return saveSubStoreTrackers(getSessionPrefStore(), StorageTypes.TRACKER_OBJECTS, trackerId, trackerValue);
    },
    removeSessionStoreTrackers: function(trackerId) {
      return removeSubStoreTrackers(getSessionPrefStore(), StorageTypes.TRACKER_OBJECTS, trackerId);
    }
  };
});