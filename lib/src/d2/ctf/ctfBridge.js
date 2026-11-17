/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/controls/form/pub.sub", "nuc/utils/log", "d2/ctf/constants", "d2/ctf/utils", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/constants", "d2/dialogs/user.settings/user.settings.utils" ], function($, _, PubSub, log, constants, utils, RestResources, commonUtils, commonConstants, userSettingsUtils) {
  "use strict";
  var ctfRegistryCallbacks = [];
  var wsHandler;
  var status = constants.Status.NOTATTEMPTED;
  function pushCallBacks(sid, optype, cbobj) {
    Object.keys(cbobj).forEach(function(key) {
      var cbObj = {
        id: sid,
        optype: optype,
        cb: cbobj[key],
        cbtype: key
      };
      ctfRegistryCallbacks.push(cbObj);
    });
  }
  function removeCallBack(sid, optype) {
    ctfRegistryCallbacks = _.reject(ctfRegistryCallbacks, function(cb) {
      return cb.id === sid && cb.optype === optype;
    });
  }
  function getCallback(sid, optype, cbtype) {
    var callbacks = ctfRegistryCallbacks.filter(function(cb) {
      return cb.id === sid && cb.cbtype === cbtype && cb.optype === optype;
    });
    return callbacks && callbacks[0] && callbacks[0].cb;
  }
  return {
    getCallback: function() {
      return ctfRegistryCallbacks;
    },
    getStatus: function() {
      return status;
    },
    setStatus: function(newStatus) {
      status = newStatus;
    },
    isCtfEnabled: function() {
      return utils.isCtfEnabledInConfig() && status === constants.Status.SUCCESS;
    },
    getUserPreferences: function() {
      return RestResources.getCurrentUser().get("preferences");
    },
    init: function(options) {
      wsHandler = options.wshandler;
      var self = this, newUserPref = {}, browserPluginModes = utils.getBrowserPluginModes();
      status = constants.Status.TRYING;
      function getBrowserPluginMode() {
        var userPref = self.getUserPreferences();
        return userPref["sv_browser_plugin_mode"] && userPref["sv_browser_plugin_mode"].toLowerCase();
      }
      function success(data) {
        var wsctf = commonConstants.BrowserPluginMode.WSCTF, prefPluginMode = getBrowserPluginMode();
        if (prefPluginMode !== wsctf && browserPluginModes.indexOf(wsctf) > -1 && !options.ignorePreferenceUpdate) {
          newUserPref["sv_browser_plugin_mode"] = wsctf;
          userSettingsUtils.updateUserSettings(newUserPref, options).done(function() {
            PubSub.trigger("user:preference:browser:plugin:update", wsctf);
          }).fail(function(err) {
            options.failure(err.message);
          }).always(function() {
            status = constants.Status.SUCCESS;
          });
        } else {
          status = constants.Status.SUCCESS;
        }
        if (data["installed_version"]) {
          utils.setVersion(data["installed_version"]);
        }
      }
      function failure() {
        var thin = commonConstants.BrowserPluginMode.THIN, prefPluginMode = getBrowserPluginMode();
        if (prefPluginMode !== commonConstants.BrowserPluginMode.THIN && !options.ignorePreferenceUpdate) {
          if (browserPluginModes.indexOf(thin) > -1) {
            newUserPref["sv_browser_plugin_mode"] = commonConstants.BrowserPluginMode.THIN;
            userSettingsUtils.updateUserSettings(newUserPref, options).done(function() {
              PubSub.trigger("user:preference:browser:plugin:update", thin);
            }).fail(function(err) {
              options.failure(err.message);
            }).always(function() {
              status = constants.Status.FAILURE;
            });
          } else {
            utils.clearWsctfAttemptedOnce();
          }
        } else {
          status = constants.Status.FAILURE;
        }
      }
      function showNotification() {
        status = constants.Status.SHOWNOTIFICATION;
      }
      function onClickInstall() {}
      function onClickCancel() {}
      var handleroptions = {
        success: success,
        failure: failure,
        showNotification: showNotification,
        onClickInstall: onClickInstall,
        onClickCancel: onClickCancel
      };
      wsHandler.connect(this, handleroptions);
    },
    publishSelectFile: function(success) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      pushCallBacks("selectFile", constants.OperationType.SELECT_FILE, cbobj);
      var source = constants.LOCAL_RESOURCE_SOURCE_CONSTANT_FILE;
      var request = {
        mode: "select_file"
      };
      this.publishSelectLocalResource(source, request);
    },
    publishUpload: function(sUid, uploadFilePath, uploadUrl, checkoutFolder, filekey, metadatakey, metadata, options, success, failure, progress) {
      if (!sUid) {
        sUid = _.uniqueId();
      }
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.FAILURE] = failure;
      cbobj[constants.CallbackTypes.PROGRESS] = progress;
      pushCallBacks(sUid, constants.OperationType.UPLOAD_FILE, cbobj);
      var url = utils.replaceD2Seperator(uploadUrl);
      this.publishUploadOperation(sUid, url, constants.OpType.IMPORT, uploadFilePath, uploadFilePath, checkoutFolder, uploadFilePath, filekey, metadatakey, metadata, options);
    },
    setCookiesInData: function(data, options) {
      var allCookies = {};
      function updateCookieKeyValue(cookieString) {
        if (cookieString && cookieString.indexOf(";") > -1) {
          var cookieArray = cookieString.split(";");
          _.each(cookieArray, function(cookieItem) {
            cookieItem = cookieItem.trim();
            if (cookieItem.indexOf("=") > -1) {
              var cookieKeyValue = cookieItem.split("=");
              if (cookieKeyValue.length === 2 && cookieKeyValue[0] && cookieKeyValue[1]) {
                allCookies[cookieKeyValue[0]] = cookieKeyValue[1];
              }
            }
          });
        }
      }
      updateCookieKeyValue(document.cookie);
      if (options && options["addnlCookies"]) {
        updateCookieKeyValue(options["addnlCookies"]);
      }
      if (_.keys(allCookies).length > 0) {
        data["cookies"] = JSON.stringify(allCookies);
      }
    },
    publishUploadOperation: function(sUid, url, operationType, fileID, file_path, checkoutFolder, uID, filekey, metadatakey, metadata, options) {
      file_path = file_path.replace(/\\/g, "/");
      var data = {
        id: "outboundFileElement",
        url: url,
        operationtype: operationType,
        file_path: file_path,
        targetfolder: checkoutFolder,
        objectid: sUid,
        uid: uID,
        filekey: filekey,
        datakey: metadatakey,
        metadata: metadata
      };
      this.setCookiesInData(data, options);
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.uploadoperation", config);
      });
    },
    publishHandshake: function() {
      var data = {
        id: "handshakeElement",
        baseappurl: ""
      };
      wsHandler.publishCTFEvent(data, "emc.ctf.handshake");
    },
    publishValidatePath: function(path, success) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      pushCallBacks("validatePath", constants.OperationType.VALIDATE_PATH, cbobj);
      var data = {
        path: path
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, constants.Events.VALIDATE_PATH, config);
      });
    },
    publishCreateDirectory: function(path, success) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      pushCallBacks("createDirectory", constants.OperationType.CREATE_DIRECTORY, cbobj);
      var data = {
        path: path
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, constants.Events.CREATE_DIRECTORY, config);
      });
    },
    publishIsFileExisting: function(path, success) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      pushCallBacks("isFileExisting", constants.OperationType.IS_FILE_EXISTING, cbobj);
      var data = {
        path: path
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, constants.Events.IS_FILE_EXISTING, config);
      });
    },
    publishRemoveFileFromCheckout: function(sCheckoutFolder, sUid) {
      var data = {
        id: "removeElement",
        objectid: sUid,
        targetfolder: sCheckoutFolder,
        operationtype: "remove_file_from_checkout"
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.removeFileFromCheckout", config);
      });
    },
    publishIsDownloaded: function(sUid, folder, success, localStorageErrCb) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.STORAGEFAILURE] = localStorageErrCb;
      pushCallBacks(sUid, constants.OperationType.IS_DOWNLOADED, cbobj);
      var data = {
        id: "isDownloadedElement",
        objectid: sUid,
        targetfolder: folder,
        operationtype: "is_downloaded"
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.isdownloaded", config);
      });
    },
    openFileFromCheckout: function(sUid, folderPath, success, failure, localStorageErrCb, downloadProgress) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.FAILURE] = failure;
      cbobj[constants.CallbackTypes.STORAGEFAILURE] = localStorageErrCb;
      cbobj[constants.CallbackTypes.PROGRESS] = downloadProgress;
      pushCallBacks(sUid, constants.OperationType.OPEN_FILE, cbobj);
      var data = {
        id: "downloadElement",
        objectid: sUid,
        customeEventID: "emc.ctf.openfile",
        targetfolder: folderPath,
        operationtype: "open_file_from_checkout"
      };
      return new Promise(resolve => {
        $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
          wsHandler.publishCTFEvent(data, "emc.ctf.openfile", config);
          resolve();
        });
      });
    },
    publishSelectFolder: function(title, mode, startPath, success, failure) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.FAILURE] = failure;
      pushCallBacks("selectResource", constants.OperationType.SELECT_RESOURCE, cbobj);
      var source = constants.LOCAL_RESOURCE_SOURCE_CONSTANT_DIRECTORY;
      var request = {
        dialog_title: title,
        mode: mode
      };
      if (startPath) {
        request["start_path"] = startPath;
      }
      this.publishSelectLocalResource(source, request);
    },
    publishSelectLocalResource: function(source, request) {
      var data = {
        id: "selectFileElement",
        source: source
      };
      for (var key in request) {
        if (Object.prototype.hasOwnProperty.call(request, key)) {
          data[key] = request[key];
        }
      }
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.selectlocalresource", config);
      });
    },
    publishNativeDownload: function(sUid, annotationIds, sUrl, opType, viewTargetFolder, targetFolder, success, failure, localStorageErrCb, downloadProgress) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.FAILURE] = failure;
      cbobj[constants.CallbackTypes.STORAGEFAILURE] = localStorageErrCb;
      cbobj[constants.CallbackTypes.PROGRESS] = downloadProgress;
      pushCallBacks(sUid, opType, cbobj);
      const data = {
        id: "downloadElement",
        customeEventID: "emc.ctf.nativedownloadoperation",
        url: utils.replaceD2Seperator(sUrl),
        objectid: sUid,
        targetfolder: targetFolder,
        operationtype: opType
      };
      if (viewTargetFolder) {
        data["view_target_folder"] = viewTargetFolder;
      }
      if (annotationIds) {
        data["annotation_ids"] = annotationIds;
      }
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.nativedownloadoperation", config);
      });
    },
    publishDownload: function(sUid, sUrl, opType, openFile, targetFolder, success, failure, localStorageErrCb, downloadProgress) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.FAILURE] = failure;
      cbobj[constants.CallbackTypes.STORAGEFAILURE] = localStorageErrCb;
      cbobj[constants.CallbackTypes.PROGRESS] = downloadProgress;
      pushCallBacks(sUid, constants.OperationType.DOWNLOAD, cbobj);
      var data = {
        id: "downloadElement",
        customeEventID: "emc.ctf.downloadoperation",
        url: utils.replaceD2Seperator(sUrl),
        objectid: sUid,
        targetfolder: targetFolder,
        operationtype: opType,
        open_file: openFile
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.downloadoperation", config);
      });
    },
    publishGetFileSize: function(sUid, folder, success, localStorageErrCb) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.STORAGEFAILURE] = localStorageErrCb;
      pushCallBacks(sUid, constants.OperationType.GET_FILE_SIZE, cbobj);
      var data = {
        id: "getFileSizeElement",
        objectid: sUid,
        targetfolder: folder,
        operationtype: "get_file_size"
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.getfilesize", config);
      });
    },
    getFileSize: function(data) {
      var id = data["id"];
      var file_size = data["filesize"];
      var cb = getCallback(id, constants.OperationType.GET_FILE_SIZE, constants.CallbackTypes.SUCCESS);
      removeCallBack(id, constants.OperationType.GET_FILE_SIZE);
      if (cb) {
        cb(file_size);
      }
    },
    publishGetFileSizeFromPath: function(path, success, failure, localStorageErrCb) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.FAILURE] = failure;
      cbobj[constants.CallbackTypes.STORAGEFAILURE] = localStorageErrCb;
      pushCallBacks("getFileSizeFromPath", constants.OperationType.GET_FILE_SIZE_FROM_PATH, cbobj);
      var data = {
        files: path
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.getFileSizeFromFilePath", config);
      });
    },
    getFileSizeFromPath: function(data) {
      var files = data && utils.getFileListWithSize(data.files), cb;
      if (files) {
        cb = getCallback("getFileSizeFromPath", constants.OperationType.GET_FILE_SIZE_FROM_PATH, constants.CallbackTypes.SUCCESS);
      } else {
        cb = getCallback("getFileSizeFromPath", constants.OperationType.GET_FILE_SIZE_FROM_PATH, constants.CallbackTypes.FAILURE);
      }
      removeCallBack("getFileSizeFromPath", constants.OperationType.GET_FILE_SIZE_FROM_PATH);
      if (cb) {
        cb(files);
      }
    },
    publishExtractFilesFromPath: function(path, success, failure, localStorageErrCb) {
      var cbobj = {};
      cbobj[constants.CallbackTypes.SUCCESS] = success;
      cbobj[constants.CallbackTypes.FAILURE] = failure;
      cbobj[constants.CallbackTypes.STORAGEFAILURE] = localStorageErrCb;
      pushCallBacks("extractFiles", constants.OperationType.EXTRACT_FILES_FROM_PATH, cbobj);
      var data = {
        folderpath: path
      };
      $.getJSON(utils.getFullURL("ctf/ctfConfig.json"), function(config) {
        wsHandler.publishCTFEvent(data, "emc.ctf.extractFiles", config);
      });
    },
    getExtractedFilesFromPath: function(data) {
      var files = data && utils.getFileListWithSize(data.filesList), cb;
      if (files) {
        cb = getCallback("extractFiles", constants.OperationType.EXTRACT_FILES_FROM_PATH, constants.CallbackTypes.SUCCESS);
      } else {
        cb = getCallback("extractFiles", constants.OperationType.EXTRACT_FILES_FROM_PATH, constants.CallbackTypes.FAILURE);
      }
      removeCallBack("extractFiles", constants.OperationType.EXTRACT_FILES_FROM_PATH);
      if (cb) {
        cb(files);
      }
    },
    isDownloaded: function(data) {
      var id = data["id"];
      var file_path = data["filepath"].replace(/\\/g, "/");
      var cb = getCallback(id, constants.OperationType.IS_DOWNLOADED, constants.CallbackTypes.SUCCESS);
      removeCallBack(id, constants.OperationType.IS_DOWNLOADED);
      if (cb) {
        cb(file_path);
      }
    },
    removeCheckedoutFiles: function() {
      var cb = getCallback("selectResource", constants.OperationType.REMOVE_DOWNLOADED_FILES, constants.CallbackTypes.SUCCESS);
      if (cb) {
        cb();
      }
    },
    selectedFile: function(data) {
      var fileData = "";
      if (!_.isEmpty(data)) {
        fileData = JSON.parse(data["selectedfiles"]).filedata;
      }
      var cb = getCallback("selectFile", constants.OperationType.SELECT_FILE, constants.CallbackTypes.SUCCESS);
      removeCallBack("selectFile", constants.OperationType.SELECT_FILE);
      if (cb) {
        cb(fileData);
      }
    },
    selectLocalResource: function(data) {
      var filePaths = JSON.parse(data.selectedfolder).selectedFolder;
      var cb;
      try {
        if (filePaths === null || filePaths.length === 0) {
          cb = getCallback("selectResource", constants.OperationType.SELECT_RESOURCE, constants.CallbackTypes.FAILURE);
          removeCallBack("selectResource", constants.OperationType.SELECT_RESOURCE);
          cb();
        } else {
          cb = getCallback("selectResource", constants.OperationType.SELECT_RESOURCE, constants.CallbackTypes.SUCCESS);
          removeCallBack("selectResource", constants.OperationType.SELECT_RESOURCE);
          cb(filePaths);
        }
      } catch (err) {
        cb = getCallback("selectResource", constants.OperationType.SELECT_RESOURCE, constants.CallbackTypes.FAILURE);
        removeCallBack("selectResource", constants.OperationType.SELECT_RESOURCE);
        cb(err);
      }
    },
    localStorageError: function(data) {
      var eventdata = data["event_data"];
      var eventDataObj = JSON.parse(eventdata);
      var id = eventDataObj["objectid"];
      var optype;
      if (eventDataObj.event_name === constants.Events.REMOVE_CHECKEDOUT_FILES) {
        optype = constants.OperationType.REMOVE_DOWNLOADED_FILES;
      } else if (eventDataObj.event_name === constants.Events.DOWNLOAD) {
        optype = constants.OperationType.DOWNLOAD;
      }
      var cb = getCallback(id, optype, constants.CallbackTypes.STORAGEFAILURE);
      removeCallBack(id, constants.OperationType.DOWNLOAD);
      if (cb) {
        cb();
      }
    },
    downloadFailed: function(data) {
      var id = data["id"];
      var cb = getCallback(id, constants.OperationType.DOWNLOAD, constants.CallbackTypes.FAILURE);
      removeCallBack(id, constants.OperationType.DOWNLOAD);
      if (cb) {
        cb(data && (data.responsetext || data.statustext));
      }
    },
    downloadCompleted: function(data) {
      var id = data["id"];
      var cb = getCallback(id, constants.OperationType.DOWNLOAD, constants.CallbackTypes.SUCCESS);
      removeCallBack(id, constants.OperationType.DOWNLOAD);
      if (cb) {
        cb();
      }
    },
    downloadProgress: function(data) {
      var id = data["id"];
      var cb = getCallback(id, constants.OperationType.DOWNLOAD, constants.CallbackTypes.PROGRESS);
      var object = {};
      object.downloaded = data["percentcomplete"];
      object.total = 100;
      if (cb) {
        cb(object);
      }
    },
    uploadFailed: function(data) {
      var sid = data.id, cb = getCallback(sid, constants.OperationType.UPLOAD_FILE, constants.CallbackTypes.FAILURE);
      removeCallBack(sid, constants.OperationType.UPLOAD_FILE);
      if (cb) {
        var errorMsg;
        if (data) {
          errorMsg = utils.getErrorMessageFromResponseText(data.responsetext) || data.statustext;
        }
        cb(errorMsg, data);
      }
    },
    uploadCompleted: function(data) {
      var ctfResponse = data["responsetext"], responseObj = ctfResponse && JSON.parse(ctfResponse), sid = data.id;
      var cb = getCallback(sid, constants.OperationType.UPLOAD_FILE, constants.CallbackTypes.SUCCESS);
      removeCallBack(sid, constants.OperationType.UPLOAD_FILE);
      if (cb) {
        cb(responseObj);
      }
    },
    uploadProgress: function(data) {
      var sid = data.id, cb = getCallback(sid, constants.OperationType.UPLOAD_FILE, constants.CallbackTypes.PROGRESS), object = {};
      object.loaded = data["percentcomplete"];
      object.total = 100;
      if (cb) {
        cb(object);
      }
    },
    validatePath: function(data) {
      var cb = getCallback("validatePath", constants.OperationType.VALIDATE_PATH, constants.CallbackTypes.SUCCESS);
      removeCallBack("validatePath", constants.OperationType.VALIDATE_PATH);
      var retVal = false;
      if (data && data["path_exists"] === constants.YES) {
        retVal = true;
      }
      if (cb) {
        cb(retVal);
      }
    },
    createDirectory: function(data) {
      var cb = getCallback("createDirectory", constants.OperationType.CREATE_DIRECTORY, constants.CallbackTypes.SUCCESS);
      removeCallBack("createDirectory", constants.OperationType.CREATE_DIRECTORY);
      var retVal = data && data["directory_exists"];
      if (cb) {
        cb(retVal);
      }
    },
    isFileExisting: function(data) {
      var cb = getCallback("isFileExisting", constants.OperationType.IS_FILE_EXISTING, constants.CallbackTypes.SUCCESS);
      removeCallBack("isFileExisting", constants.OperationType.IS_FILE_EXISTING);
      var retVal = false;
      if (data && data["doesFileExists"] === constants.TRUE) {
        retVal = true;
      }
      if (cb) {
        cb(retVal);
      }
    }
  };
});