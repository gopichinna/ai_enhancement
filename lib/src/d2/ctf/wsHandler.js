/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "module", "nuc/lib/jquery", "nuc/lib/underscore", "d2/ctf/constants", "d2/ctf/utils", "css!dctmw/ctf/ctf" ], function(require, module, $, _, constants, utils) {
  "use strict";
  var config = module.config();
  var ctfWorker, connectionData, ctfConfig, launcherIFrame;
  var edgeTimeout = 0;
  var edgeMsLaunchUriCallbackCalled = false;
  var edgeLaunchServerAttempted = false;
  _.defaults(config, {
    pluginClientType: "browser"
  });
  return {
    initEventMap: function(ctfBridge) {
      var map = {};
      map[constants.Events.HANDSHAKE_COMPLETED] = this.handshakeCompleted;
      map[constants.Events.FOLDER_SELECTED] = ctfBridge.selectLocalResource;
      map[constants.Events.IS_DOWNLOADED_RESPONSE] = ctfBridge.isDownloaded;
      map[constants.Events.FILE_SELECTED] = ctfBridge.selectedFile;
      map[constants.Events.DOWNLOAD_COMPLETED] = ctfBridge.downloadCompleted;
      map[constants.Events.DOWNLOAD_FAILED] = ctfBridge.downloadFailed;
      map[constants.Events.LOCALSTORAGE_ERROR] = ctfBridge.localStorageError;
      map[constants.Events.DOWNLOAD_PROGRESS] = ctfBridge.downloadProgress;
      map[constants.Events.UPLOAD_COMPLETED] = ctfBridge.uploadCompleted;
      map[constants.Events.UPLOAD_FAILED] = ctfBridge.uploadFailed;
      map[constants.Events.UPLOAD_PROGRESS] = ctfBridge.uploadProgress;
      map[constants.Events.REMOVE_CHECKEDOUT_FILES] = ctfBridge.removeCheckedoutFiles;
      map[constants.Events.VALIDATE_PATH_RESPONSE] = ctfBridge.validatePath;
      map[constants.Events.CREATE_DIRECTORY_RESPONSE] = ctfBridge.createDirectory;
      map[constants.Events.IS_FILE_EXISTING_RESPONSE] = ctfBridge.isFileExisting;
      map[constants.Events.GET_FILESIZE_RESPONSE] = ctfBridge.getFileSize;
      map[constants.Events.GET_FILESIZE_FROM_PATH_RESPONSE] = ctfBridge.getFileSizeFromPath;
      map[constants.Events.EXTRACT_FILE_FROM_PATH_RESPONSE] = ctfBridge.getExtractedFilesFromPath;
      return map;
    },
    setConnectionData: function(conndata) {
      connectionData = conndata;
    },
    setWorker: function(worker) {
      ctfWorker = worker;
    },
    downloadCTF: function() {
      var self = this;
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(ctfConfig) {
        self.installCTF(ctfConfig);
        $("div.binf-widgets").removeClass("pushBodyDown");
        var elem = document.getElementById("extensionNotification");
        elem && elem.parentNode.removeChild(elem);
      });
    },
    checkForUpgrade: function() {
      var self = this, dfd = $.Deferred();
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(ctfConfig) {
        if (self.isUpgradeAvailable(ctfConfig)) {
          dfd.resolve();
        } else {
          dfd.reject();
        }
      });
      return dfd.promise();
    },
    getCTFdownloadUrl: function() {
      var self = this, dfd = $.Deferred();
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(ctfConfig) {
        dfd.resolve(self.getCTFdownloadLocation(ctfConfig));
      });
      return dfd.promise();
    },
    getCTFdownloadLocation: function(ctfConfig) {
      var installerLocation;
      if (utils.getBrowserOS().isMacOSX) {
        installerLocation = utils.getFullURL(ctfConfig.mac.WSNativeApplication.installer_url);
      } else {
        installerLocation = utils.getFullURL(ctfConfig.windows.WSNativeApplication.installer_url);
      }
      return installerLocation;
    },
    installCTF: function(ctfConfig) {
      var installerLocation = this.getCTFdownloadLocation(ctfConfig);
      if (utils.getBrowserType().isChrome) {
        window.open(installerLocation);
        window.focus();
      } else if (utils.getBrowserType().isIE) {
        this.downloadForIE(installerLocation);
      } else if (utils.getBrowserType().isFirefox) {
        location.href = installerLocation;
      } else if (utils.getBrowserType().isSafari) {
        var link = document.createElement("a");
        link.href = installerLocation;
        if (document.createEvent) {
          var e = document.createEvent("MouseEvents");
          e.initEvent("click", true, true);
          link.dispatchEvent(e);
        }
      } else if (utils.getBrowserType().isEdge) {
        this.downloadForIE(installerLocation);
      }
      return false;
    },
    downloadForIE: function(download_path) {
      var fullUrl = download_path;
      var _window = window.open(fullUrl, "_blank");
      _window.document.execCommand("SaveAs", true, fullUrl);
    },
    connect: function(ctfBridge, options) {
      connectionData = utils.getConnectionData();
      var me = this;
      this.handshakeCompleted = options.success;
      this.fallBackToThinClient = options.failure;
      this.fallBackOnShowNotification = options.showNotification;
      this.onClickInstall = options.onClickInstall;
      this.onClickCancel = options.onClickCancel;
      require([ "d2/ctf/worker", "d2/ctf/ctfBridge", "i18n!d2/ctf/impl/nls/lang" ], function(worker, ctfBridge, lang) {
        $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(data) {
          ctfConfig = data;
          ctfWorker = new Worker(URL.createObjectURL(new Blob([ "(" + worker.workerFunction.toString() + ")()" ], {
            type: "text/javascript"
          })));
          me.loadWSCTF(ctfWorker, lang, ctfConfig);
          ctfWorker.addEventListener("message", function(event) {
            var eventmap = me.initEventMap(ctfBridge);
            function handshake() {
              var data = {
                baseappurl: ""
              };
              me.publishCTFEvent(data, constants.Events.HANDSHAKE, ctfConfig);
            }
            utils.log("Received" + event.data);
            var data = event.data;
            utils.log("Webpage recv: event.data=" + JSON.stringify(data));
            var status = data.status;
            var response = data.message;
            switch (status) {
             case constants.StatusCode.CONNECTED:
              {
                me.insertExtensionElement();
                utils.log("Web-socket connection established");
                handshake();
                utils.setLastConnectionUriParams(connectionData.port, connectionData.launchId);
                utils.log("Checking if app upgrade is available");
                utils.setIsWsctfInstalled();
                var performUpgrade = _.bind(me.performUpgradeIfAvailable, me, ctfConfig, lang);
                setTimeout(performUpgrade, 1e3);
                break;
              }

             case constants.StatusCode.CONNECTION_FAILED:
              {
                utils.log("ERROR connecting to WS Server: StatusCode.CONNECTION_FAILED");
                var connectionDataFromWorker = data.connectionData;
                if (connectionDataFromWorker.numTriesMax === 0) {
                  me.launchServer(ctfConfig, lang);
                } else {
                  if (!utils.isWsctfAttemptedOnce()) {
                    utils.setWsctfAttemptedOnce();
                    me.showInstallNotification(ctfConfig, lang);
                    utils.error("****** WSCTF Connection attempted once ");
                  } else {
                    utils.clearWsctfAttemptedOnce();
                    me.fallBackToThinClient();
                    utils.error("****** Fallen to Thin client....");
                  }
                }
                break;
              }

             case constants.StatusCode.ERROR:
              {
                utils.setLastConnectionUriParams(connectionData.port, connectionData.launchId);
                utils.error("StatusCode.ERROR received from worker.js ");
                break;
              }

             case constants.StatusCode.DISCONNECTED:
              {
                me.removeExtensionElement();
                utils.log("StatusCode.DISCONNECTED message received from worker.js: Connection to WS server is lost");
                break;
              }

             case constants.StatusCode.RECV:
              {
                if (response.version !== undefined && ctfConfig !== undefined && ctfConfig != null && parseInt(response.version.substr(response.version.lastIndexOf(".") + 1)) < parseInt(utils.getAppServerWSCTFVersion())) {
                  me.removeExtensionElement();
                  utils.log("Kill DCMApp.exe if version needs to be upgraded and allow users to install new version");
                  me.killDCMApp();
                } else {
                  utils.log("Message recieved");
                  if (response.eventID) {
                    var listener = eventmap[response.eventID];
                    if (listener) {
                      utils.log("dispatching the event: " + response.eventID);
                      var cbData = {};
                      if (response.data) {
                        for (var key in response.data) {
                          if (Object.prototype.hasOwnProperty.call(response.data, key)) {
                            var attributeValue = response.data[key];
                            if (typeof attributeValue === "object") {
                              attributeValue = JSON.stringify(attributeValue);
                            }
                            cbData[key] = attributeValue;
                          }
                        }
                      }
                      listener(cbData);
                    }
                    if (response.eventID === constants.Events.HANDSHAKE_COMPLETED) {
                      me.removeLauncherIFrame();
                    }
                  }
                }
              }
            }
          }, false);
        });
      });
      return this;
    },
    killDCMApp: function(ctfConfig) {
      utils.error(utils.getCurTime() + "  *** - Killing the running dcm app to enable upgrade ");
      var element = utils.getElement("killThyself");
      this.publishCTFEvent(element, constants.Events.KILL, ctfConfig);
    },
    performUpgradeIfAvailable: function(ctfConfig, lang) {
      if (this.isUpgradeAvailable(ctfConfig)) {
        this.killDCMApp(ctfConfig);
        utils.clearLastConnectionUriParams();
        setTimeout(this.showUpgradeNotification(ctfConfig, lang), 1e3);
      }
    },
    showUpgradeNotification: function(ctfConfig, lang) {
      var labels = {};
      labels.prompt = lang.upgradeCtf;
      labels.no = lang.no;
      labels.yes = lang.update;
      this.showInstallNotification(ctfConfig, lang, labels);
    },
    isUpgradeAvailable: function(ctfConfig) {
      var latestAvailableAppVersion = utils.getLatestAppVersion(ctfConfig);
      var installedAppVersion = utils.getVersion();
      if (!installedAppVersion) {
        utils.log(" *** App version is not loaded yet");
        return false;
      }
      var availableApp = latestAvailableAppVersion.split(".");
      var installedApp = installedAppVersion.split(".");
      var majorAvl = parseInt(availableApp[0], 10);
      var minorAvl = parseInt(availableApp[1], 10);
      var patchAvl = parseInt(availableApp[2], 10);
      var buildAvl = parseInt(availableApp[3], 10);
      var majorIns = parseInt(installedApp[0], 10);
      var minorIns = parseInt(installedApp[1], 10);
      var patchIns = parseInt(installedApp[2], 10);
      var buildIns = parseInt(installedApp[3], 10);
      if (majorAvl > majorIns) {
        utils.log("Latest available Major Version is higher than installed... So Upgrade is available ");
        return true;
      } else if (majorAvl < majorIns) {
        utils.log("Latest available Major Version is lower than installed... So No Upgrade ");
        return false;
      }
      if (minorAvl > minorIns) {
        utils.log("Latest available Minor Version is higher than installed.... So upgrade is available ");
        return true;
      } else if (minorAvl < minorIns) {
        utils.log("Latest available Minor Version is lower than installed ... So No Upgrade ");
        return false;
      }
      if (patchAvl > patchIns) {
        utils.log("Latest available Patch Version is higher than installed.... So Upgrade is available");
        return true;
      } else if (patchAvl < patchIns) {
        utils.log("Latest available Patch Version is lower than installed.... So No Upgrade");
        return false;
      }
      if (buildAvl > buildIns) {
        utils.log("Latest available Version 4th component is higher than installed.... So Upgrade is available");
        return true;
      } else if (buildAvl < buildIns) {
        utils.log("Latest available Patch 4th component is lower than installed.... So No Upgrade");
        return false;
      }
      return false;
    },
    loadWSCTF: function(ctfWorker, lang, ctfConfig) {
      utils.log("Entered loadWSCTF");
      var lastConnectionUriParams = utils.getLastConnectionUriParams();
      var webSocketPort = lastConnectionUriParams.port;
      var launchId = lastConnectionUriParams.launchId;
      if (webSocketPort > 0 && launchId.length > 0) {
        utils.log("Attempting to connect on previous port=" + webSocketPort + " and launchId=" + launchId);
        this.connectPreviousPort(webSocketPort, launchId, ctfWorker);
      } else {
        return this.launchServer(ctfConfig, lang);
      }
    },
    connectPreviousPort: function(webSocketPort, launchId, ctfWorker) {
      var browser = utils.getBrowserType();
      connectionData.protocol = utils.getWebSocketProtocol(browser);
      connectionData.port = webSocketPort;
      connectionData.launchId = launchId;
      connectionData.numTriesMax = 0;
      connectionData.numTried = 0;
      utils.log("posting OPEN message to worker, port=" + webSocketPort);
      ctfWorker.postMessage({
        opcode: constants.OpCode.OPEN,
        connectionData: connectionData
      });
    },
    publishCTFEvent: function(data, eventId, ctfConfig) {
      data["product_name"] = "d2sv";
      if (utils.getBrowserOS().isMacOSX) {
        data["ssl_config_data"] = ctfConfig.mac.WSNativeApplication.ssl_config_data;
        data["app_version"] = ctfConfig.mac.WSNativeApplication.version;
        data["app_name"] = ctfConfig.mac.WSNativeApplication.app_name;
      } else {
        data["ssl_config_data"] = ctfConfig.windows.WSNativeApplication.ssl_config_data;
        data["app_version"] = ctfConfig.windows.WSNativeApplication.version;
        data["app_name"] = ctfConfig.windows.WSNativeApplication.app_name;
      }
      data["locale"] = utils.getCookie("locale");
      data["event_name"] = eventId;
      var eventType = constants.Events.BRIDGECONNECT;
      utils.log("caught the " + eventType + " in Content Script.");
      var messagePayload = {
        eventType: eventType
      };
      for (var k in data) {
        if (Object.prototype.hasOwnProperty.call(data, k)) {
          messagePayload[k] = data[k];
        }
      }
      if (window.location.origin) {
        messagePayload["origin"] = window.location.origin;
      } else {
        messagePayload["origin"] = window.location.protocol + "//" + window.location.host;
      }
      messagePayload = JSON.stringify(messagePayload);
      ctfWorker.postMessage({
        opcode: constants.OpCode.SEND,
        data: messagePayload
      });
    },
    showInstallNotification: function(ctfConfig, lang, labels) {
      this.fallBackOnShowNotification();
      $("div.binf-widgets").addClass("pushBodyDown");
      var $ctfmain = $("<div/>", {
        id: "ctfmain",
        class: "ctfmain"
      });
      var $note = $("<div/>", {
        id: "extensionNotification",
        class: "note"
      });
      $ctfmain.append($note);
      $("body").append($ctfmain);
      var $messageLabelDiv = $("<div/>", {
        id: "messageLabelDiv",
        class: "messageLabel"
      });
      var promptLabel = labels ? labels.prompt : lang.installCtf;
      $messageLabelDiv.text("  " + promptLabel);
      var $buttonContainer = $("<div/>", {
        id: "buttonContainerDiv",
        class: "buttonContainer"
      });
      var $noButton = $("<a>", {
        class: "noButton button"
      }).attr("href", "");
      var $noSpan = $("<span>", {
        class: "noButtonCaption buttonCaption"
      });
      var noLabel = labels ? labels.no : lang.no;
      var $noText = document.createTextNode(noLabel);
      $noSpan.append($noText);
      $noButton.append($noSpan);
      var me = this;
      $noButton.on("click", function(e) {
        me.onClickCancel();
        $("div.binf-widgets").removeClass("pushBodyDown");
        if (!e) {
          e = window.event;
        }
        if (e.preventDefault) {
          e.preventDefault();
        }
        var elem = document.getElementById("extensionNotification");
        elem.parentNode.removeChild(elem);
        me.fallBackToThinClient();
        return false;
      });
      var $yesButton = $("<a>", {
        class: "yesButton button"
      }).attr("href", "");
      var $yesSpan = $("<span>", {
        class: "yesButtonCaption buttonCaption"
      });
      var yesLabel = labels ? labels.yes : lang.yes;
      var $yesText = document.createTextNode(yesLabel);
      $yesSpan.append($yesText);
      $yesButton.append($yesSpan);
      $yesButton.on("click", function(e) {
        me.onClickInstall();
        if (!e) {
          e = window.event;
        }
        if (e.preventDefault) {
          e.preventDefault();
        }
        $("div.binf-widgets").removeClass("pushBodyDown");
        var elem = document.getElementById("extensionNotification");
        elem.parentNode.removeChild(elem);
        return me.installCTF(ctfConfig);
      });
      $buttonContainer.append($yesButton);
      $buttonContainer.append($noButton);
      $note.append($messageLabelDiv);
      $note.append($buttonContainer);
      $yesButton.trigger("focus");
    },
    insertExtensionElement: function() {
      utils.log("inserted the extension element");
      var extensionID = "7e697fda-3702-11e7-a919-92ebcb67fe33";
      var extensionElement = document.getElementById(extensionID);
      if (extensionElement && extensionElement.length && extensionElement.length > 0) {
        return;
      }
      extensionElement = document.createElement("ContentXferWS");
      extensionElement.setAttribute("id", extensionID);
      document.body.appendChild(extensionElement);
    },
    removeExtensionElement: function() {
      utils.log("remove the extension element");
      var extensionElement = document.getElementsByTagName("ContentXferWS");
      if (extensionElement && extensionElement.length && extensionElement.length > 0) {
        var element = document.getElementsByTagName("ContentXferWS"), index;
        for (index = element.length - 1; index >= 0; index--) {
          element[index].parentNode.removeChild(element[index]);
        }
      }
    },
    launchServerSucceeded: function(customProtocolUri, webSocketPort, launchId) {
      var msg = "Launch " + customProtocolUri + " succeeded";
      utils.log(msg);
      this.connectAfterLaunchingServer(webSocketPort, launchId);
    },
    launchServerAttempted: function(customProtocolUri, webSocketPort, launchId) {
      var msg = "Launch " + customProtocolUri + " attempted";
      utils.log(msg);
      this.connectAfterLaunchingServer(webSocketPort, launchId);
    },
    launchServerFailed: function(reason, customProtocolUri, ctfConfig, lang) {
      var msg = "Launch " + customProtocolUri + " failed";
      if (reason) {
        msg += ": reason = " + reason;
      }
      utils.error("Launching of the Native App failed ");
      if (!utils.isWsctfInstalled()) {
        utils.error("*** Looks like WSCTF is not installed... So showing Yellow bar for installation ");
        this.showInstallNotification(ctfConfig, lang);
      } else {
        utils.error("*** Native app is installed but it could not be launched... So falling back to thin mode ");
        this.fallBackToThinClient();
      }
      utils.error(msg);
    },
    connectAfterLaunchingServer: function(webSocketPort, launchId) {
      utils.log("Attempting to connect on port=" + webSocketPort + " with launchId=" + launchId);
      connectionData.port = webSocketPort;
      connectionData.launchId = launchId;
      ctfWorker.postMessage({
        opcode: constants.OpCode.OPEN,
        connectionData: connectionData
      });
    },
    createLauncherIFrame: function(hidden) {
      var iframe = document.createElement("iframe");
      iframe.id = "protocolCheckerIFrame";
      iframe.uri = "about:blank";
      if (hidden) {
        iframe.style.display = "none";
      } else {
        iframe.height = "1px";
        iframe.width = "1px";
      }
      document.body.appendChild(iframe);
      launcherIFrame = iframe;
      return launcherIFrame;
    },
    removeLauncherIFrame: function() {
      if (document.getElementById("protocolCheckerIFrame")) {
        document.body.removeChild(launcherIFrame);
        utils.log("*** Removed launcher iframe");
      }
    },
    launchWsctf: function(customProtocolUri, webSocketPort, launchId) {
      var iframe = document.createElement("iframe");
      iframe.id = "protocolCheckerIFrame";
      iframe.uri = "about:blank";
      iframe.height = "200px";
      iframe.width = "200px";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      utils.error("Safari... Just before launching wsctf ");
      iframe.contentWindow.location.href = customProtocolUri;
      utils.error("Safari... After Launching");
      var me = this;
      setTimeout(function() {
        me.launchServerAttempted(customProtocolUri, webSocketPort, launchId);
      }, 2e3);
    },
    edgeLaunchServerSucceeded: function(customProtocolUri, webSocketPort, launchId) {
      edgeMsLaunchUriCallbackCalled = true;
      if (edgeTimeout !== 0) {
        utils.log("Cleared edge launch timer");
        clearTimeout(edgeTimeout);
      }
      if (!edgeLaunchServerAttempted) {
        this.launchServerSucceeded(customProtocolUri, webSocketPort, launchId);
      }
    },
    edgeLaunchServerFailed: function(customProtocolUri, ctfConfig, lang) {
      edgeMsLaunchUriCallbackCalled = true;
      if (edgeTimeout !== 0) {
        utils.log("Cleared edge launch timer");
        clearTimeout(edgeTimeout);
      }
      if (!edgeLaunchServerAttempted) {
        this.launchServerFailed("", customProtocolUri, ctfConfig, lang);
      }
    },
    edgeLaunchServerAttemptedIfNoCallbacksWereCalled: function(customProtocolUri, webSocketPort, launchId) {
      if (!edgeMsLaunchUriCallbackCalled) {
        utils.log("msLaunchUri callbacks were not called");
        edgeLaunchServerAttempted = true;
        this.launchServerAttempted(customProtocolUri, webSocketPort, launchId);
      }
    },
    launchServer: function(ctfConfig, lang) {
      var webSocketPort = utils.generateRandomPort();
      var launchId = utils.generateLaunchId();
      var browser = utils.getBrowserType();
      utils.log("Launching server on new port=" + webSocketPort + " and launchId=" + launchId);
      var customProtocolUri = utils.getCustomProtocolURI(webSocketPort, launchId);
      var launcherIFrame;
      var hiddenIFrame = false;
      connectionData.numTried = 0;
      connectionData.numTriesMax = constants.MAX_NUM_WEBSOCKET_CONNECTION_TRIES;
      if (config.pluginClientType === "non-browser") {
        try {
          utils.log("Non Browser App Launching " + customProtocolUri);
          window.location.href = customProtocolUri;
          utils.log("Non Browser App Launched " + customProtocolUri);
          this.launchServerAttempted(customProtocolUri, webSocketPort, launchId);
        } catch (e) {
          utils.error("Non Browser App Launch " + customProtocolUri + " failed: exception=" + e.message);
          this.launchServerFailed(e.message, customProtocolUri, ctfConfig, lang);
        }
      } else if (navigator.msLaunchUri) {
        var launchServerSucceededCB = _.bind(this.launchServerSucceeded, this, customProtocolUri, webSocketPort, launchId);
        var launchServerFailedCB = _.bind(this.launchServerFailed, this, "", customProtocolUri, ctfConfig, lang);
        if (browser.isEdge) {
          var msEdgeVersion = parseInt(navigator.userAgent.match(/Edge\/[0-9]+\.(.[0-9]+)/)[1]);
          if (msEdgeVersion < 16299) {
            launchServerSucceededCB = this.edgeLaunchServerSucceeded(customProtocolUri, webSocketPort, launchId);
            launchServerFailedCB = this.edgeLaunchServerFailed(customProtocolUri, ctfConfig, lang);
            edgeTimeout = setTimeout(this.edgeLaunchServerAttemptedIfNoCallbacksWereCalled(customProtocolUri, webSocketPort, launchId), 1e3);
          }
          try {
            utils.log("MS Launching " + customProtocolUri);
            navigator.msLaunchUri(customProtocolUri, launchServerSucceededCB, launchServerFailedCB);
            utils.log("MS Launched " + customProtocolUri);
          } catch (e) {
            utils.log("MS Launch " + customProtocolUri + " failed: exception=" + e.message);
            setTimeout(this.launchServerFailed(e.message, customProtocolUri));
            return false;
          }
        } else {
          try {
            utils.log(utils.getCurTime() + " MS Launching " + customProtocolUri);
            navigator.msLaunchUri(customProtocolUri, launchServerSucceededCB, launchServerFailedCB);
            utils.log(utils.getCurTime() + " MS Launched " + customProtocolUri);
          } catch (e) {
            utils.log(utils.getCurTime() + " MS Launch " + customProtocolUri + " failed: exception=" + e.message);
            setTimeout(this.launchServerFailed(e.message), 1);
            return false;
          }
        }
      } else if (browser.isIE) {
        launcherIFrame = this.createLauncherIFrame(hiddenIFrame);
        try {
          utils.log("IE Launching " + customProtocolUri);
          launcherIFrame.contentWindow.location.href = customProtocolUri;
          utils.log("IE Launched " + customProtocolUri);
          this.launchServerAttempted(customProtocolUri, webSocketPort, launchId);
        } catch (e) {
          utils.error("IE Launch: Error while trying to launch server :" + e.message);
          this.launchServerFailed(e.message, customProtocolUri, ctfConfig, lang);
        }
      } else if (browser.isChrome) {
        launcherIFrame = this.createLauncherIFrame(hiddenIFrame);
        try {
          utils.log("Chrome Launching " + customProtocolUri);
          launcherIFrame.contentWindow.location.href = customProtocolUri;
          utils.log("Chrome Launched " + customProtocolUri);
          this.launchServerAttempted(customProtocolUri, webSocketPort, launchId);
        } catch (e) {
          utils.error("Chrome Launch " + customProtocolUri + " failed: exception=" + e.message);
          this.launchServerFailed(e.message, customProtocolUri, ctfConfig, lang);
        }
      } else if (browser.isFirefox) {
        hiddenIFrame = true;
        launcherIFrame = this.createLauncherIFrame(hiddenIFrame);
        this.createLauncherIFrame(browser);
        try {
          utils.log("FF Launching " + customProtocolUri);
          launcherIFrame.contentWindow.location.href = customProtocolUri;
          utils.log("FF Launched " + customProtocolUri);
          this.launchServerSucceeded(customProtocolUri, webSocketPort, launchId);
        } catch (e) {
          utils.error("FF Launch " + customProtocolUri + " failed: " + e.name);
          this.launchServerFailed(e.name, customProtocolUri, ctfConfig, lang);
        }
      } else {
        this.launchWsctf(customProtocolUri, webSocketPort, launchId);
      }
    }
  };
});