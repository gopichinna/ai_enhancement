/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "dctmw/utils/utils", "dctmw/utils/user.preference.storage" ], function(utils, userPrefStore) {
  "use strict";
  var STORE_NAME = "Session", PREF_KEY_RESTORE_FRAGMENT = "restoreFragment", PREF_KEY_SESSION_RESIDUE = "residue", sessionStore = utils.getSessionStore(STORE_NAME);
  function saveUserRestorableFragment(fragment) {
    userPrefStore.saveSessionStorePreference(STORE_NAME, PREF_KEY_RESTORE_FRAGMENT, fragment);
  }
  function saveSessionRestorableFragment(fragment) {
    sessionStore.set(PREF_KEY_RESTORE_FRAGMENT, fragment);
  }
  function getUserRestorableFragment() {
    return userPrefStore.getSessionStorePreference(STORE_NAME, PREF_KEY_RESTORE_FRAGMENT);
  }
  function getSessionRestorableFragment() {
    return sessionStore.get(PREF_KEY_RESTORE_FRAGMENT);
  }
  function clearUserRestorableFragment() {
    userPrefStore.removeSessionStorePreference(STORE_NAME, PREF_KEY_RESTORE_FRAGMENT);
  }
  function clearSessionRestorableFragment() {
    sessionStore.remove(PREF_KEY_RESTORE_FRAGMENT);
  }
  function clearRestorableFragments() {
    clearUserRestorableFragment();
    clearSessionRestorableFragment();
  }
  function saveSessionResidue(data) {
    sessionStore.set(PREF_KEY_SESSION_RESIDUE, data);
  }
  function getSessionResidue() {
    return sessionStore.get(PREF_KEY_SESSION_RESIDUE);
  }
  function clearSessionResidue() {
    sessionStore.remove(PREF_KEY_SESSION_RESIDUE);
  }
  return {
    saveUserRestorableFragment: saveUserRestorableFragment,
    saveSessionRestorableFragment: saveSessionRestorableFragment,
    getUserRestorableFragment: getUserRestorableFragment,
    getSessionRestorableFragment: getSessionRestorableFragment,
    clearUserRestorableFragment: clearUserRestorableFragment,
    clearSessionRestorableFragment: clearSessionRestorableFragment,
    clearRestorableFragments: clearRestorableFragments,
    saveSessionResidue: saveSessionResidue,
    getSessionResidue: getSessionResidue,
    clearSessionResidue: clearSessionResidue
  };
});