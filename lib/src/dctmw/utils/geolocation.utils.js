/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/jquery.parse.param", "nuc/utils/log", "dctmw/utils/authenticators/auth.storage", "dctmw/utils/constants", "dctmw/utils/utils", "i18n!dctmw/utils/nls/lang" ], function(module, require, _, $, parseParams, log, AuthStorage, Constants, Utils, lang) {
  "use strict";
  log = log(module.id);
  var config = _.defaults(module.config(), {
    enableLocationTracking: false,
    mandatorylocationTracking: false,
    requestTimeoutMS: 1e4,
    embedMode: false
  });
  return {
    fetchCurrentClientLocation: function() {
      var deferred = $.Deferred();
      if (config.enableLocationTracking === true) {
        var authData = AuthStorage.getCurrTabData();
        var opts = {
          timeout: config.requestTimeoutMS
        };
        if (Utils.isAppworks()) {
          opts.enableHighAccuracy = true;
          opts.maximumAge = 3e5;
        }
        if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
          navigator.geolocation.getCurrentPosition(function(position) {
            delete authData[Constants.AuthStorage.LOCATION_PERMISSION];
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var locaionDetails = "latitude=" + lat + ";longitude=" + lng;
            authData[Constants.AuthStorage.CLIENT_LOCATION] = locaionDetails;
            AuthStorage.setCurrTabData(authData);
            deferred.resolve(locaionDetails);
          }, function(error) {
            log.error("Error while fetching the geo-locaton details ", error);
            delete authData[Constants.AuthStorage.CLIENT_LOCATION];
            var errorMessage = !Utils.isAppworks() ? lang.geolocationDisabledError : lang.mobileGeolocationDisabledError;
            AuthStorage.setCurrTabData(authData);
            config.mandatorylocationTracking ? deferred.reject(errorMessage) : deferred.resolve();
          }, opts);
        } else {
          log.warn("Geo-locaton API is not supported in this browser");
          delete authData[Constants.AuthStorage.LOCATION_PERMISSION];
          delete authData[Constants.AuthStorage.CLIENT_LOCATION];
          AuthStorage.setCurrTabData(authData);
          deferred.reject();
        }
      } else {
        log.debug("Geo-location tracking disabled.");
        deferred.resolve();
      }
      return deferred.promise();
    },
    updateLocationDetails: function(header) {
      var location = AuthStorage.getCurrTabData()[Constants.AuthStorage.CLIENT_LOCATION];
      if (location) {
        header[Constants.Headers.CLIENT_LOCATION] = location;
      }
      var appName = AuthStorage.getCurrTabData()[Constants.AuthStorage.CLIENT_APPLICATION];
      if (appName) {
        header[Constants.Headers.CLIENT_APPLICATION] = appName;
      }
      if (Utils.isMobile()) {
        header[Constants.Headers.CLIENT_APPLICATION] = Constants.ApplicationName.MOBILE;
      }
      if (config.embedMode === true) {
        this.setClientLocationForEmbedMode();
      } else {
        this.fetchCurrentClientLocation();
      }
      return header;
    },
    updateApplicationDetails: function(appName) {
      var appData = AuthStorage.getCurrTabData();
      if (appData) {
        appData[Constants.AuthStorage.CLIENT_APPLICATION] = appName;
      }
    },
    setClientLocationForEmbedMode: function() {
      var authData = AuthStorage.getCurrTabData(), queryParam = this.getQueryParams();
      if (config.embedMode === true && config.enableLocationTracking === true) {
        if (config.mandatorylocationTracking === true && !queryParam["client_location"]) {
          return false;
        } else {
          var locationDetailsFromUrl = queryParam["client_location"] || "";
          authData[Constants.AuthStorage.CLIENT_LOCATION] = locationDetailsFromUrl;
          AuthStorage.setCurrTabData(authData);
          return true;
        }
      }
    },
    getQueryParams: function() {
      return window.location.search && parseParams(window.location.search.substr(1));
    },
    checkLocationPermission: function(initialCheck) {
      var permission = {
        showError: false,
        errorMessage: ""
      };
      var authData = AuthStorage.getCurrTabData();
      if (config.enableLocationTracking && config.mandatorylocationTracking && !authData[Constants.AuthStorage.CLIENT_LOCATION]) {
        if (authData[Constants.AuthStorage.LOCATION_PERMISSION] === "denied") {
          permission.errorMessage = !Utils.isAppworks() ? lang.geolocationDisabledError : lang.mobileGeolocationDisabledError;
          permission.showError = true;
        } else {
          if (initialCheck) {
            authData[Constants.AuthStorage.LOCATION_PERMISSION] = "denied";
            AuthStorage.setCurrTabData(authData);
            permission.errorMessage = !Utils.isAppworks() ? lang.geolocationDisabledError : lang.mobileGeolocationDisabledError;
            permission.showError = true;
          }
        }
      }
      return permission;
    }
  };
});