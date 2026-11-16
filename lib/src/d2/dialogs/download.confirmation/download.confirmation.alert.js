/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "dctmw/utils/rest.resources", "dctmw/utils/utils", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/download.confirmation/impl/download.confirmation.body.view", "i18n!d2/dialogs/download.confirmation/impl/nls/lang", "css!d2/dialogs/download.confirmation/impl/download.confirmation" ], function($, _, Marionette, RestResources, utils, ModelAlert, DownloadConfirmationBodyView, lang) {
  "use strict";
  var LOCAL_STORAGE_NAME = "ViewerPreference", localPrefStore;
  var PREFERENCE_KEY = "NoPreview";
  var StorageValues = Object.freeze({
    Download: "Download"
  });
  var downloadDialog = Marionette.Object.extend({
    initialize: function(options) {
      this.options = options;
      this.doNotAsk = false;
    },
    getLocalPrefStore: function() {
      var storeName = LOCAL_STORAGE_NAME + ":" + RestResources.getCurrentUser().get("name");
      if (!localPrefStore || localPrefStore.name !== storeName) {
        localPrefStore = utils.getLocalStore(storeName);
      }
      return localPrefStore;
    },
    saveStorePreference: function(store, preferenceKey, preferenceValue) {
      return store.set(preferenceKey, preferenceValue);
    },
    getStorePreference: function(preferenceKey) {
      return this.getLocalPrefStore().get(preferenceKey);
    },
    show: function() {
      var storePreferenceValue, dfd = $.Deferred();
      storePreferenceValue = this.getStorePreference(PREFERENCE_KEY);
      if (storePreferenceValue && storePreferenceValue === StorageValues.Download) {
        console.info("Previously don't show message option selected with 'Download', to get the dialog again clear browsing data/localstorage");
        return dfd.resolve().promise();
      }
      return this.showDialog();
    },
    showDialog: function() {
      var me = this, dfd = $.Deferred();
      this.dialogBodyView = new DownloadConfirmationBodyView({});
      let alertPromise = ModelAlert.confirmInformation(function(result) {
        if (result) {
          if (me.dialogBodyView && me.dialogBodyView.doNotShowCheckbox) {
            me.saveStorePreference(me.getLocalPrefStore(), PREFERENCE_KEY, StorageValues.Download);
          }
          dfd.resolve();
        } else {
          dfd.reject();
        }
      }, "", lang.DownloadViewHeader, {
        buttons: {
          showYes: true,
          labelYes: lang.DownloadLabel,
          showNo: false,
          showCancel: true
        },
        contentView: me.dialogBodyView,
        modalClass: "d2-download-confirmation-alert"
      });
      this.once("close:dialog", () => {
        _.isFunction(alertPromise.close) && alertPromise.close();
      });
      return dfd.promise();
    }
  });
  return downloadDialog;
});