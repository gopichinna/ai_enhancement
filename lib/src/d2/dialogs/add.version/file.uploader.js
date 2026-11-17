/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/utils/url", "csui/models/fileuploads", "csui/models/fileupload", "dctmw/utils/utils", "d2/utils/constants", "nuc/models/node/node.model", "d2/utils/rest.linkrels", "d2/utils/format.utils", "d2/ctf/ctfBridge", "csui/utils/taskqueue", "d2/dialogs/add.version/add.version.utils", "i18n!d2/dialogs/add.version/impl/nls/lang" ], function(require, _, $, Url, UploadFileCollection, FileUploadModel, utils, constants, NodeModel, RestLinkrels, formatUtils, ctfBridge, TaskQueue, AddVersionUtils, lang) {
  "use strict";
  var ctfUploadCollection;
  function FileUploader(options) {
    options || (options = {});
    this.options = options;
  }
  _.extend(FileUploader.prototype, {
    getCheckinUrl: function(includeAuthTokens) {
      var format = this.options.data && this.options.data.general ? this.options.data.general["a_content_type"] : "";
      var contentsize = this.options.file ? this.options.file.size : 0;
      var queryParams = {
        format: format,
        "content-size": contentsize,
        inline: true
      };
      if (includeAuthTokens) {
        queryParams["include-auth-tokens"] = true;
      }
      if (this.options.externalShare && this.options.externalShare.core) {
        if (this.options.externalShare.shareMode === constants.ShareIntentType.COLLABORATE && this.options.shareInfo.useCorePath) {
          queryParams["external-share-system"] = "core";
        } else if (this.options.data && this.options.data.general) {
          if (this.options.data.general["add_version_to_core"] === true) {
            queryParams["target-ext-share-systems"] = "core";
            if (this.options.config && this.options.config.properties && this.options.config.properties["sync_shared_as_native"] === true) {
              queryParams["c2_override"] = true;
            }
          } else if (this.options.data.general["continue_old_version_in_core"] === true && this.options.externalShare.shareMode === constants.ShareIntentType.COLLABORATE) {
            queryParams["retain-lock-on-old-version"] = true;
          }
        }
      }
      var deferred = $.Deferred(), url = Url.appendQuery(this.options.checkinurl, Url.combineQueryString(queryParams));
      var headers = {};
      headers[constants.Headers.TIME_ZONE] = formatUtils.getBrowserTimeZone();
      $.ajax(this.options.node.connector.extendAjaxOptions({
        url: url,
        headers: headers,
        success: function(response) {
          deferred.resolve(response);
        },
        error: function(xhr) {
          var errorDetails = utils.parseAjaxError(xhr);
          if (utils.isMobile()) {
            errorDetails.status = xhr.status;
          }
          deferred.reject(errorDetails);
        }
      }));
      return deferred.promise();
    },
    onStateChangeMobile: function(state, progressData, options) {
      if (state === "rejected") {
        if (!options) {
          state = "aborted";
        }
      }
      var values = {
        state: state,
        count: 0
      };
      if (options && options.type === "progress") {
        var loaded = options.loaded, total = options.total;
        values.total = total;
        if (loaded <= total) {
          values.count = loaded;
        }
      } else {
        if (state === "aborted") {
          values.total = 1;
        }
      }
      this.uploadCollection.each(function(fileUpload) {
        fileUpload.set(values);
      });
    },
    onStateChange: function(progressData, options) {
      var state = this.deferred.state();
      if (state === "rejected") {
        if (!options) {
          state = "aborted";
        }
      }
      var values = {
        state: state,
        count: 0
      };
      if (options && options.type === "progress") {
        var loaded = options.loaded, total = progressData.total;
        if (options.lengthComputable && options.total > total) {
          progressData.total = options.total;
        }
        values.total = progressData.total;
        if (loaded <= progressData.total) {
          values.count = loaded;
          progressData.count = loaded;
        }
      } else {
        if (state === "aborted") {
          values.total = 1;
        }
      }
      this.uploadCollection.each(function(fileUpload) {
        fileUpload.set(values);
      });
    },
    getData: function() {
      var dataobj = {};
      if (this.options.data.general) {
        if (_.isEmpty(this.options.data.general.a_content_type)) {
          delete this.options.data.general.a_content_type;
        }
        dataobj["checkin-properties"] = this.options.data.general;
      } else {
        dataobj["checkin-properties"] = {
          make_current: true,
          retain_lock: false
        };
      }
      if (this.options.data.properties) {
        if (_.isEmpty(this.options.data.properties.a_content_type)) {
          delete this.options.data.properties.a_content_type;
        }
        dataobj["properties"] = this.options.data.properties;
      }
      if (this.options.data["signoff-inputs"]) {
        dataobj["signoff-inputs"] = this.options.data["signoff-inputs"];
      }
      return dataobj;
    },
    mobileFileUpload: function(url) {
      this.dfd = $.Deferred();
      require([ "mobile/utils/platform.controller", "d2mob/utils/mobile/filepicker" ], function(PlatformController, FilePicker) {
        if (!!FilePicker.getIsFilePickerAvailable() || this.options.checkinFixedFile) {
          var file = this.options.file;
          var ajaxOptions = this.options.node.connector.extendAjaxOptions({}), fileKey = "uploadFile", isRelativePath = !!this.options.checkinFixedFile, sharedLocation = false;
          var extraFormData = {};
          if (this.options.data) {
            extraFormData = {
              metadata: JSON.stringify(this.getData())
            };
          }
          var fileuploadmodel = new FileUploadModel({
            node: this.options.node,
            file: file
          });
          fileuploadmodel.node = this.options.node;
          fileuploadmodel.abort = function(reason) {
            this._unblockActions();
            this.dfd.reject(reason);
          };
          var nodes = [ fileuploadmodel ];
          this.uploadCollection = new UploadFileCollection(nodes, {
            connector: this.options.node.connector
          });
          this._updateNodeInMobileList();
          PlatformController.uploadFile(file.path, url, fileKey, extraFormData, ajaxOptions.headers, sharedLocation, isRelativePath, _.bind(this.onStateChangeMobile, this)).done(_.bind(function(response) {
            this.onStateChangeMobile("resolved");
            PlatformController.removeFile(file.path, false);
            this.dfd.resolve(response && response.data);
          }, this)).fail(_.bind(function(error) {
            this.onStateChangeMobile("rejected");
            this.dfd.reject(error && error.data);
          }, this));
        } else {
          this.checkinFile(url).done(this.dfd.resolve).fail(this.dfd.reject);
        }
      }.bind(this));
      return this.dfd.promise();
    },
    checkinFile: function(urls) {
      this.deferred = $.Deferred();
      var me = this;
      var file = this.options.file;
      var fileuploadmodel = new FileUploadModel({
        node: this.options.node,
        file: file
      });
      fileuploadmodel.node = this.options.node;
      if (!fileuploadmodel.get("name") && this.options.node.get("name")) {
        fileuploadmodel.set("name", this.options.node.get("name"));
      }
      fileuploadmodel.abort = function(reason) {
        me._unblockActions();
        me.deferred.reject(reason);
      };
      var nodes = [ fileuploadmodel ];
      this.uploadCollection = new UploadFileCollection(nodes, {
        connector: this.options.node.connector
      });
      var progressData = {
        total: this.options.file ? this.options.file.size : 0,
        count: 0
      };
      var formdata = new FormData();
      var appendFile = true;
      if (this.options.externalShare && this.options.externalShare.core && this.options.externalShare.shareMode === constants.ShareIntentType.COLLABORATE && this.options.shareInfo.useCorePath) {
        appendFile = false;
      }
      if (appendFile && file && !me?.options?.fileImportUrl) {
        file instanceof Blob ? formdata.append("uploadFile", file, file.name) : formdata.append("uploadFile", file);
      }
      var checkinProperties;
      if (this.options.data) {
        var checkinFormData = this.getData();
        checkinProperties = checkinFormData && checkinFormData["checkin-properties"];
        formdata.append("metadata", JSON.stringify(checkinFormData));
      }
      if (utils.isMobile()) {
        this._updateNodeInMobileList();
      }
      var processData;
      function performUpload(urls) {
        var url = urls;
        if (_.isArray(urls) && urls.length > 0) {
          url = urls.shift();
          if (urls.length > 0 && _.isUndefined(processData) || _.isNull(processData)) {
            processData = {};
          }
        }
        let extraHeader = {};
        if (me?.options?.token && me?.options?.fileImportUrl) {
          extraHeader["X-D2-VIEWER-ACCESS-TOKEN"] = me.options.token;
        }
        formdata = formdata || new FormData();
        if (me?.options?.fileImportUrl) {
          formdata.append("fileImportUrl", me.options.fileImportUrl);
        }
        var ajaxOptions = me.options.node.connector.extendAjaxOptions({
          url: url,
          type: "POST",
          contentType: false,
          processData: false,
          headers: extraHeader,
          xhrFields: {
            withCredentials: !appendFile
          },
          xhr: function() {
            var myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
              myXhr.upload.addEventListener("progress", function(event) {
                if (processData) {
                  if (processData.loaded > 0 && processData.loaded > progressData.count) {
                    return;
                  }
                  processData.loaded = progressData.count;
                }
                me.deferred.notify(progressData, event);
              }, false);
            }
            return myXhr;
          },
          success: function(data) {
            if (checkinProperties) {
              data["checkin-properties"] = checkinProperties;
            }
            me.deferred.resolve(data);
          },
          data: formdata
        });
        var connectorError = ajaxOptions.error;
        ajaxOptions.error = function(xhr) {
          if (_.isArray(urls) && urls.length > 0) {
            performUpload(urls);
          } else {
            if (xhr.responseJSON && xhr.responseJSON.status === 401 && xhr.responseJSON.code !== "E_INVALID_AUTHENTICATION") {
              connectorError.apply(this, arguments);
              me.deferred.reject();
            } else {
              var errorDetails = utils.parseAjaxError(xhr);
              if (utils.isMobile()) {
                errorDetails.status = xhr.status;
              }
              if (xhr.responseJSON?.code === "E_INTERNAL_SERVER_ERROR" && xhr.responseJSON?.customData) {
                errorDetails.customData = xhr.responseJSON.customData;
              }
              me.deferred.reject(errorDetails);
            }
          }
        };
        $.ajax(ajaxOptions);
      }
      performUpload(urls);
      this.deferred.progress(_.bind(this.onStateChange, this)).done(_.bind(this.onStateChange, this)).fail(_.bind(this.onStateChange, this));
      return this.deferred.promise();
    },
    _blockActions: function() {
      this.options.view && this.options.view.blockActions && this.options.view.blockActions();
    },
    _unblockActions: function() {
      this.options.view && this.options.view.unblockActions && this.options.view.unblockActions();
    },
    checkinFileUsingCTF: function(urls, authTokens, success, failure, progress) {
      var me = this;
      var change = _.bind(onCtfStateChange, this);
      if (!this.options.isMultipleCheckin) {
        var file = this.options.file;
        var fileuploadmodel = new FileUploadModel({
          node: this.options.node,
          file: file
        });
        fileuploadmodel.abort = function() {
          me._unblockActions();
          change(null, {}, "rejected", ctfUploadCollection);
          failure(null);
        };
        var nodes = [ fileuploadmodel ];
        ctfUploadCollection = new UploadFileCollection(nodes, {
          connector: this.options.node.connector
        });
      }
      function onCtfStateChange(state, uploadColl, progressData) {
        var values = {
          state: state,
          count: 0,
          total: 100
        };
        if (progressData && progressData.loaded <= values.total) {
          values.count = progressData.loaded;
        }
        if (!this.options.isMultipleCheckin) {
          uploadColl.each(function(fileUpload) {
            fileUpload.set(values);
          });
        }
      }
      var sUid = this.options.node.get("id");
      var filekey = "uploadFile";
      var metadata = this.getData();
      var checkinProperties = metadata && metadata["checkin-properties"];
      var metadatakey = "metadata";
      var options = {
        addnlCookies: authTokens
      }, processData;
      function performUpload(urls) {
        var url = urls;
        if (_.isArray(urls) && urls.length > 0) {
          url = urls.shift();
          if (urls.length > 0 && _.isUndefined(processData) || _.isNull(processData)) {
            processData = {};
          }
        }
        ctfBridge.publishUpload(sUid, me.options.file.path, url, "NONE", filekey, metadatakey, JSON.stringify(metadata), options, function(data) {
          change("resolved", ctfUploadCollection);
          if (checkinProperties) {
            data["checkin-properties"] = checkinProperties;
          }
          success(data);
        }, function(err, response) {
          if (_.isArray(urls) && urls.length > 0) {
            performUpload(urls);
          } else {
            change("rejected", ctfUploadCollection);
            let data = {};
            try {
              let res = JSON.parse(response.responsetext);
              if (res.code === "E_INTERNAL_SERVER_ERROR" && res.customData) {
                data.code = res.code;
                data.customData = res.customData;
              }
            } catch (e) {
              console.warn(e);
            }
            failure(err, data);
          }
        }, function(progressData) {
          if (processData) {
            if (processData.loaded > 0 && processData.loaded > progressData.loaded) {
              return;
            }
            processData.loaded = progressData.loaded;
          }
          change("pending", ctfUploadCollection, {
            loaded: progressData.loaded
          });
          progress && progress(progressData);
        });
      }
      performUpload(urls);
    },
    uploadUsingCtf: function(uploadSuccess, uploadFailure, uploadProgress) {
      var me = this;
      this.getCheckinUrl(true).done(function(data) {
        var authTokens = data.entries[0].content["auth-tokens"], urls = _.map(data.entries, function(entry) {
          var url;
          if (entry.content && entry.content.url) {
            url = entry.content.url;
            if (me.options.ignoreCheckinConfig) {
              url = Url.appendQuery(url, Url.combineQueryString({
                "ignore-checkin-configs": true
              }));
            }
          }
          return url;
        });
        me._blockActions();
        me.checkinFileUsingCTF(urls, authTokens, function(data) {
          me._unblockActions();
          uploadSuccess(data);
        }, function(error, data) {
          me._unblockActions();
          var errorObj = {
            message: error || lang.FileUploadFailureCtf,
            customData: data?.customData
          };
          uploadFailure(errorObj);
        }, function(progressData) {
          uploadProgress && uploadProgress(progressData);
        });
      }).fail(function(error) {
        me._unblockActions();
        uploadFailure(error);
      });
    },
    upload: function() {
      var deferred = $.Deferred();
      var me = this;
      this._blockActions();
      this.getCheckinUrl().done(function(data) {
        var urls = _.map(data.entries, function(entry) {
          var url;
          if (entry.content && entry.content.url) {
            url = entry.content.url;
            if (me.options.ignoreCheckinConfig) {
              url = Url.appendQuery(url, Url.combineQueryString({
                "ignore-checkin-configs": true
              }));
            }
          }
          return url;
        });
        me._blockActions();
        var promise;
        if (utils.isAppworks()) {
          promise = me.mobileFileUpload(urls[0]);
        } else {
          promise = me.checkinFile(urls);
        }
        promise.progress(deferred.notify).done(function(data) {
          deferred.resolve(data);
        }).fail(function(error) {
          if (utils.isMobile()) {
            me._updateNodeInMobileList(true);
          }
          deferred.reject(error);
        }).always(function() {
          me._unblockActions();
        });
      }).fail(function(error) {
        deferred.reject(error);
      }).always(function() {
        me._unblockActions();
      });
      return deferred.promise();
    },
    _updateNodeInMobileList: function(removeProgress) {
      if (removeProgress) {
        this.options.node.fileUpload = null;
      } else {
        var nodeModel = this.options.node, parentCollection = this.options.node.collection;
        if (this.options.wizard) {
          parentCollection.trigger("request");
        }
        if (parentCollection) {
          parentCollection.remove(nodeModel);
          nodeModel.fileUpload = this.uploadCollection.at(0);
          parentCollection.unshift(nodeModel);
          parentCollection.trigger("top:scroll");
        }
      }
      this.options.node.trigger("change");
    },
    uploadFiles: function() {
      var deferred = $.Deferred(), promises = [];
      var fileConfigdata = _.clone(this.options);
      promises = _.map(fileConfigdata, function(eachFileData) {
        var fileUploader = new FileUploader(eachFileData);
        return fileUploader.upload();
      });
      $.whenAll.apply($, promises).fail(function(errorDetails) {
        deferred.resolve(errorDetails);
      }).done(function(Data) {
        deferred.resolve(Data);
      });
      return deferred.promise();
    },
    uploadFilesUsingCtf: function() {
      var dfd = $.Deferred(), promises, doneFiles = [], failedFiles = [];
      this.taskQueue = new TaskQueue({
        parallelism: 1
      });
      var filesdataArray = _.clone(this.options);
      promises = _.map(filesdataArray, function(eachFileData) {
        var deferred = $.Deferred();
        deferred.done(function(data) {
          doneFiles.push(data);
        }).fail(function(error) {
          failedFiles.push(error);
        });
        this.taskQueue.pending.add(this.createTaskForFile(eachFileData, deferred));
        return deferred.promise();
      }.bind(this));
      $.whenAll.apply($, promises).done(function() {
        dfd.resolve(doneFiles);
      }).fail(function() {
        dfd.resolve(failedFiles);
      });
      return dfd.promise();
    },
    createTaskForFile: function(eachFileData, dfd) {
      return {
        worker: function() {
          var fileUploader = new FileUploader(eachFileData);
          if (AddVersionUtils.isForceThinClientMode(eachFileData)) {
            fileUploader.upload().done(function(data) {
              dfd.resolve(data);
            }).fail(function(error) {
              dfd.reject(error);
            });
          } else {
            fileUploader.uploadUsingCtf(function(data) {
              dfd.resolve(data);
            }, function(error) {
              dfd.reject(error);
            });
          }
          return dfd.promise();
        }
      };
    }
  });
  return FileUploader;
});