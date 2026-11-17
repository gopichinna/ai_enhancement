/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/utils/log", "nuc/utils/base", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/jquery.parse.param", "nuc/utils/url", "d2/ctf/constants", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/constants", "csui/lib/binf/js/binf" ], function(module, log, base, $, _, parseParams, Url, constants, RestResources, utils, commonConstants) {
  "use strict";
  var config = module.config(), currentBrowser, installed_version;
  return {
    doCtfHandshake: function() {
      return this.isCtfEnabledInConfig();
    },
    replaceD2Seperator: function(str) {
      return str.replace(/\u00AC/g, "|");
    },
    getAppServerWSCTFVersion: function(ctfConfig) {
      var version = this.getLatestAppVersion(ctfConfig);
      return version.substr(version.lastIndexOf(".") + 1);
    },
    getElement: function(elementId) {
      var element = document.getElementById(elementId);
      if (element) {
        element.parentNode.removeChild(element);
      }
      element = document.createElement(elementId);
      element.setAttribute("id", elementId);
      document.documentElement.appendChild(element);
      return element;
    },
    setLastConnectionUriParams: function(port, launchId) {
      if (port && port > 0 && launchId) {
        window.localStorage.setItem(constants.LAST_CONNECTION_URI_PROP_NAME, "" + port + ":" + launchId);
      } else {
        window.localStorage.removeItem(constants.LAST_CONNECTION_URI_PROP_NAME);
      }
    },
    clearLastConnectionUriParams: function() {
      window.localStorage.removeItem(constants.LAST_CONNECTION_URI_PROP_NAME);
    },
    isWsctfAttemptedOnce: function() {
      return window.localStorage.getItem(constants.IS_WSCTF_ATTEMPTED_ONCE);
    },
    setWsctfAttemptedOnce: function() {
      window.localStorage.setItem(constants.IS_WSCTF_ATTEMPTED_ONCE, true);
    },
    clearWsctfAttemptedOnce: function() {
      window.localStorage.setItem(constants.IS_WSCTF_ATTEMPTED_ONCE, "");
    },
    isWsctfInstalled: function() {
      return window.localStorage.getItem(constants.IS_WSCTF_INSTALLED);
    },
    log: function(msg) {
      log.debug(this.getCurTime() + " " + msg);
    },
    error: function(msg) {
      log.error(this.getCurTime() + " " + msg);
    },
    setIsWsctfInstalled: function() {
      window.localStorage.setItem(constants.IS_WSCTF_INSTALLED, true);
    },
    getLatestAppVersion: function(ctfConfig) {
      if (this.getBrowserOS().isMacOSX) {
        return ctfConfig.mac.WSNativeApplication.version;
      } else {
        return ctfConfig.windows.WSNativeApplication.version;
      }
    },
    setVersion: function(version) {
      installed_version = version;
    },
    getVersion: function() {
      log("*** installed_version = " + installed_version);
      return installed_version ? installed_version : null;
    },
    generateLaunchId: function() {
      var now = new Date();
      var year = now.getFullYear();
      var month = now.getMonth() + 1;
      var day = now.getDate();
      var hour = now.getHours();
      var minute = now.getMinutes();
      var second = now.getSeconds();
      var ms = now.getMilliseconds();
      year = "" + year;
      month = "" + (month < 10 ? "0" + month : month);
      day = "" + (day < 10 ? "0" + day : day);
      hour = "" + (hour < 10 ? "0" + hour : hour);
      minute = "" + (minute < 10 ? "0" + minute : minute);
      second = "" + (second < 10 ? "0" + second : second);
      ms = "" + (ms < 10 ? "00" + ms : ms < 100 ? "0" + ms : ms);
      var array = new Uint32Array(2);
      var crypto = window.crypto || window.msCrypto;
      crypto.getRandomValues(array);
      var i0 = array[0] & 2147483647;
      var i1 = array[1] & 2147483647;
      var value = "" + i0 + ("" + i1);
      return [ year, month, day, hour, minute, second, ms, "_", value ].join("");
    },
    getRandomPortRange: function() {
      return [ 10024, 64025 ];
    },
    generateRandomPort: function() {
      var r = Math.random();
      var portRange = this.getRandomPortRange();
      return Math.floor((1 - r) * portRange[0] + r * portRange[1]);
    },
    getBrowserType: function() {
      if (currentBrowser) {
        return currentBrowser;
      } else {
        var browser = {};
        var isIE = base.isIE11();
        var isEdge = base.isEdge();
        var isFF = base.isFirefox();
        var isSafari = base.isSafari();
        var isChrome = base.isChrome();
        if (isIE) {
          browser.isIE = true;
        } else if (isEdge) {
          browser.isEdge = true;
        } else if (isFF) {
          browser.isFirefox = true;
        } else if (isSafari) {
          browser.isSafari = true;
        } else if (isChrome) {
          browser.isChrome = true;
        }
        currentBrowser = browser;
        return browser;
      }
    },
    getServerAddress: function() {
      var browser = this.getBrowserType();
      var serverAddress = "localhost";
      if (browser.isIE || browser.isEdge) {
        serverAddress = "127.0.0.1";
      }
      this.log("SERVER_ADDRESS=" + serverAddress);
      return serverAddress;
    },
    getCookie: function(name) {
      var value = "; " + document.cookie;
      var parts = value.split("; " + name + "=");
      if (parts.length === 2) {
        return parts.pop().split(";").shift();
      }
    },
    getBrowserOS: function() {
      var browserOS = {};
      var ua = navigator.userAgent.toLowerCase();
      if (ua.indexOf("windows") !== -1 || ua.indexOf("win32") !== -1) {
        browserOS.isWindows = true;
      } else if (ua.indexOf("macintosh") !== -1 || ua.indexOf("mac os x") !== -1) {
        if (ua.indexOf("iphone") !== -1 || ua.indexOf("ipad") !== -1) {
          browserOS.isMacIOS = true;
        } else {
          browserOS.isMacOSX = true;
        }
      } else if (ua.indexOf("linux") !== -1) {
        browserOS.isLinux = true;
      }
      return browserOS;
    },
    getNextRetryWaitPeriodInMillis: function() {
      return 1e3;
    },
    getAddressType: function(browser) {
      return browser.isIE || browser.isEdge ? "lb" : "lh";
    },
    getCustomProtocolURI: function(webSocketPort, launchId) {
      var browser = this.getBrowserType();
      return constants.CUSTOMPROTOCOL + ":" + webSocketPort + ":" + launchId + ":" + this.getWebSocketProtocol(browser) + ":" + this.getAddressType(browser);
    },
    getCurTime: function() {
      var today = new Date();
      return today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + ":" + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + ":" + today.getMilliseconds();
    },
    getWebSocketProtocol: function(browser) {
      var webSocketProtocol = window.location.href.indexOf("http:") === 0 ? "ws" : "wss";
      if (browser.isSafari) {
        webSocketProtocol = "ws";
      }
      return webSocketProtocol;
    },
    getLastConnectionUriParams: function() {
      var uri = {
        port: 0,
        launchId: ""
      };
      var strUri = window.localStorage.getItem(constants.LAST_CONNECTION_URI_PROP_NAME);
      if (strUri && strUri.length > 0) {
        var parts = strUri.split(":");
        if (parts.length > 1) {
          try {
            uri.port = parseInt(parts[0]);
            uri.launchId = parts[1];
          } catch (e) {
            this.error("Could not parse lastConnectionUri");
          }
        }
      }
      return uri;
    },
    getConnectionData: function(language) {
      var browser = this.getBrowserType();
      var SERVER_ADDRESS = this.getServerAddress();
      var WEB_SOCKET_PROTOCOL = this.getWebSocketProtocol(browser);
      var connectionData = {
        address: SERVER_ADDRESS,
        port: 0,
        launchId: "",
        language: language,
        protocol: WEB_SOCKET_PROTOCOL,
        numTriesMax: constants.MAX_NUM_WEBSOCKET_CONNECTION_TRIES,
        numTried: 0,
        nextTryWaitPeriodMilliseconds: constants.NEXT_TRY_WAIT_PERIOD_MILLISECONDS
      };
      connectionData.numTried = 0;
      var lastUriParams = this.getLastConnectionUriParams();
      if (lastUriParams.port > 0) {
        connectionData.port = lastUriParams.port;
        connectionData.launchId = lastUriParams.launchId;
      }
      return connectionData;
    },
    addWsEventListener: function(eventID, handler) {
      if (window.document.addEventListener) {
        window.document.addEventListener(eventID, handler, false);
      } else if (window.document.attachEvent) {
        window.document.attachEvent(eventID, handler);
      }
    },
    getFullURL: function(relativeURL) {
      return Url.combine(window.sv.config.baseLocation, relativeURL);
    },
    getBackdropForFileUploader: function() {
      var $backdrop = $('<div class="binf-modal-backdrop binf-fade binf-in ctf-file-browse-backdrop" tabindex="0"/>'), defaultContainer = $.fn.binf_modal.getDefaultContainer();
      $(defaultContainer).append($backdrop);
      $backdrop.keydown(function(event) {
        if (event.keyCode === 9) {
          event.stopPropagation();
          event.preventDefault();
        }
      });
      $backdrop.focus();
      return $backdrop;
    },
    getFileWithSize: function(filePathSize) {
      var filePathSizeSplit = filePathSize && filePathSize.split("__");
      if (filePathSizeSplit && filePathSizeSplit.length > 1) {
        var fileSize = filePathSizeSplit.pop(), filePath = filePathSizeSplit.join("__"), fileName = filePath.replace(/^.*[\\\/]/, "");
        fileSize = fileSize && Number(fileSize);
        return {
          name: fileName,
          path: filePath,
          size: fileSize,
          pluginMode: commonConstants.BrowserPluginMode.WSCTF
        };
      }
    },
    getFileListWithSize: function(files) {
      if (files) {
        try {
          var fileArray = JSON.parse(files);
          if (fileArray && fileArray.length > 0) {
            var fileList = [];
            _.each(fileArray, function(filePathSize) {
              var file = this.getFileWithSize(filePathSize);
              fileList.push(file);
            }.bind(this));
            return fileList;
          }
        } catch (err) {
          log.error("Error while fetching file size", err);
        }
      }
    },
    getErrorMessageFromResponseText: function(responsetext) {
      var errorMsg;
      if (responsetext) {
        try {
          var error = utils.parseError("json", responsetext);
          errorMsg = error && error.message;
        } catch (err) {
          log.error("Error while parsing response", err);
        }
      }
      return errorMsg;
    },
    getDefaultPluginMode: function() {
      return config.defaultPluginMode;
    },
    isCtfEnabledForDevice: function() {
      return this.getBrowserOS().isWindows || !utils.isMobile() && !base.isTouchBrowser();
    },
    isCtfEnabledInConfig: function() {
      var browserPluginModes = this.getBrowserPluginModes(), userpref = this.getUserPreference(), savedBrowserPluginMode = userpref["sv_browser_plugin_mode"] && userpref["sv_browser_plugin_mode"].toLowerCase();
      if (this.isCtfEnabledForDevice() && browserPluginModes && browserPluginModes.length > 0 && browserPluginModes.indexOf(commonConstants.BrowserPluginMode.WSCTF) > -1 && (browserPluginModes.length === 1 && browserPluginModes[0] === commonConstants.BrowserPluginMode.WSCTF || !savedBrowserPluginMode && browserPluginModes[0] === commonConstants.BrowserPluginMode.WSCTF || savedBrowserPluginMode === commonConstants.BrowserPluginMode.WSCTF)) {
        return true;
      }
      return false;
    },
    updateFilePathProperties: function(files, folderPath) {
      if (files && files.length > 0 && folderPath) {
        var folderPathList = _.reject(folderPath.split(/[\\\/]/), function(path) {
          return !path;
        }), folderName = folderPathList && folderPathList.pop();
        _.each(files, function(file) {
          var filePathList = _.reject(file.path.split(/[\\\/]/), function(path) {
            return !path;
          }), filepath = filePathList.join("/"), fileExtn = file.name.split(".").pop().toLowerCase(), fileFormat = RestResources.getFormats().find(function(format) {
            return format && format.get("dos_extension") === fileExtn && format.get("is_hidden") === false && format.get("mime_type") && format.get("is-default");
          });
          file.type = fileFormat ? fileFormat.get("mime_type") : "";
          filepath = filepath.replace(folderPathList.join("/"), "");
          if (filepath && filepath[0] === "/") {
            filepath = filepath.substring(1, filepath.length);
          }
          file.relativePath = filepath;
          file.rootDirectory = folderName;
          file.rootDirectoryPath = folderPath;
        });
      }
    },
    getBrowserPluginModes: function() {
      var userPref = this.getUserPreference();
      if (userPref && userPref["user_client_experience"]) {
        return userPref["user_client_experience"].split("_");
      } else {
        return RestResources.getProductInfo().get("browser_plugin_mode");
      }
    },
    getUserPreference: function() {
      return RestResources.getCurrentUser().get("preferences");
    }
  };
});