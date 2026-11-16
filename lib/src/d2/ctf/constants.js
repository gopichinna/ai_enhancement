/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([], function() {
  "use strict";
  return Object.freeze({
    OperationType: Object.freeze({
      DOWNLOAD: "download",
      SELECT_RESOURCE: "selectresource",
      SELECT_FILE: "selectfile",
      REMOVE_DOWNLOADED_FILES: "removedownloadedfiles",
      IS_DOWNLOADED: "isDownloaded",
      UPLOAD_FILE: "uploadFile",
      VALIDATE_PATH: "validatePath",
      CREATE_DIRECTORY: "createDirectory",
      IS_FILE_EXISTING: "isFileExisting",
      GET_FILE_SIZE: "getFileSize",
      GET_FILE_SIZE_FROM_PATH: "getFileSizeFromPath",
      EXTRACT_FILES_FROM_PATH: "extractFiles",
      OPEN_FILE: "open_file_from_checkout",
      NATIVE_DOWNLOAD_EDIT_MERGE_SET_REVISION_MODE: "native_download_edit_merge_set_revision_mode",
      NATIVE_DOWNLOAD_EDIT_SET_REVISION_MODE: "native_download_edit_set_revision_mode",
      NATIVE_DOWNLOAD_EDIT_MERGE_ANNOTATION: "native_download_edit_merge_annotation"
    }),
    OpType: Object.freeze({
      EXPORT: "export_content",
      CHECKOUT: "checkout",
      IMPORT: "import",
      VIEW: "view_content",
      OPEN_CHECKEDOUT: "open_file_from_checkout",
      DOWNLOAD: "download"
    }),
    CallbackTypes: Object.freeze({
      SUCCESS: "success",
      FAILURE: "failure",
      PROGRESS: "progress",
      WARNING: "warning",
      STORAGEFAILURE: "storagefailure"
    }),
    StatusCode: Object.freeze({
      CONNECTION_FAILED: -3,
      ERROR: -2,
      DISCONNECTED: -1,
      RECV: 0,
      CONNECTED: 1,
      INFO: 2,
      PROGRESS: 3
    }),
    OpCode: Object.freeze({
      OPEN: 1,
      SEND: 0,
      CLOSE: -1
    }),
    Events: Object.freeze({
      HANDSHAKE: "emc.ctf.handshake",
      HANDSHAKE_COMPLETED: "emc.ctf.handshakeCompleted",
      BRIDGECONNECT: "emc.ctf.ctfBridgeConnect",
      KILL: "emc.ctf.killThyself",
      UPLOAD_COMPLETED: "emc.ctf.uploadCompleted",
      UPLOAD_FAILED: "emc.ctf.uploadFailed",
      UPLOAD_PROGRESS: "emc.ctf.uploadProgress",
      DOWNLOAD: "emc.ctf.downloadoperation",
      DOWNLOAD_COMPLETED: "emc.ctf.downloadCompleted",
      DOWNLOAD_FAILED: "emc.ctf.downloadFailed",
      LOCALSTORAGE_ERROR: "emc.ctf.localstorageerror",
      DOWNLOAD_WARNING: "emc.ctf.downloadWarning",
      DOWNLOAD_PROGRESS: "emc.ctf.downloadProgress",
      IS_DOWNLOADED_RESPONSE: "emc.ctf.isdownloadedresponse",
      FOLDER_SELECTED: "emc.ctf.folderSelected",
      FILE_SELECTED: "emc.ctf.filesSelected",
      ADD_ON_INITED: "emc.ctf.addonInited",
      GET_FILESIZE_RESPONSE: "emc.ctf.getfilesizeresponse",
      GET_FILESIZE_FROM_PATH_RESPONSE: "emc.ctf.FileSizeResponse",
      EXTRACT_FILE_FROM_PATH_RESPONSE: "emc.ctf.ExtractFileListResponse",
      OUTLOOK_SELECTED: "emc.ctf.outlookFilesSelected",
      INSTALL_NATIVE_APP: "emc.ctf.installnativeapp",
      UPDATE_FILE_INFO: "emc.ctf.updateFileInfo",
      REMOVE_CHECKEDOUT_FILES: "emc.ctf.removeFileFromCheckout",
      IS_FILE_EXISTING: "emc.ctf.isFileExisting",
      IS_FILE_EXISTING_RESPONSE: "emc.ctf.isFileExistingResponse",
      VALIDATE_PATH: "emc.ctf.validatepath",
      VALIDATE_PATH_RESPONSE: "emc.ctf.PathValidationResponse",
      CREATE_DIRECTORY: "emc.ctf.createDirectory",
      CREATE_DIRECTORY_RESPONSE: "emc.ctf.createDirectoryResponse"
    }),
    Mode: Object.freeze({
      EDIT: "edit",
      EXPORT: "export",
      REMOVE_FILE_FROM_CHECKOUT: "remove_file_from_checkout",
      VIEW: "view"
    }),
    Status: Object.freeze({
      NOTATTEMPTED: 0,
      TRYING: 1,
      SUCCESS: 2,
      FAILURE: 3,
      SHOWNOTIFICATION: 4
    }),
    LOCAL_RESOURCE_SOURCE_CONSTANT_FILE: "file",
    LOCAL_RESOURCE_SOURCE_CONSTANT_DIRECTORY: "directory",
    REMOVE_IFRAME_AFTER: 1e4,
    CUSTOMPROTOCOL: "dctmctf",
    LAST_CONNECTION_URI_PROP_NAME: "lastConnectionUri",
    MAX_NUM_WEBSOCKET_CONNECTION_TRIES: 10,
    NEXT_TRY_WAIT_PERIOD_MILLISECONDS: 200,
    NEXT_TRY_WAIT_PERIOD_MILLISECONDS_MACOSX: 1e3,
    IS_WSCTF_INSTALLED: "isWSCTFInstalled",
    IS_WSCTF_ATTEMPTED_ONCE: "WsctfAttemptedOnce",
    YES: "Yes",
    TRUE: "true",
    FALSE: "false"
  });
});