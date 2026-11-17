/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/models/nodes", "nuc/utils/url", "csui/utils/command.error", "csui/utils/commandhelper", "nuc/utils/log", "csui/dialogs/modal.alert/modal.alert", "csui/models/command", "d2/controls/globalmessage/globalmessage", "d2/utils/download.manager", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/utils", "d2/ctf/ctfBridge", "d2/ctf/utils", "d2/ctf/constants", "d2/utils/constants", "dctmw/utils/rest.resources", "d2/utils/format.utils", "d2/dialogs/user.settings/user.settings.utils", "d2/dialogs/zipanddownload/zip.download.utils", "nuc/utils/base", "i18n!csui/utils/commands/nls/localized.strings", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, NodeCollection, Url, CommandError, CommandHelper, log, Alert, CommandModel, GlobalMessage, DownloadManager, RestLinkrels, constants, utils, ctfBridge, ctfUtils, ctfConstants, commonConstants, RestResources, formatUtils, userSettingsUtils, zipDownloadUtils, base, lang, d2lang) {
  "use strict";
  var DownloadCommand = CommandModel.extend({
    defaults: {
      signature: "Download",
      command_key: "Download",
      name: lang.CommandNameDownload,
      verb: lang.CommandVerbDownload,
      doneVerb: lang.CommandDoneVerbDownload,
      c2_override: false
    },
    enabled: function(status, options) {
      if (status.nodes.length > 0) {
        if (status?.data?.menuId == "menuContextRenditionsExport" && status.nodes.length > 1) {
          return false;
        }
        var nonFolderNodes = status.nodes.filter(function(node) {
          return node.get("type") !== constants.Types.FOLDER || node.get("id") === constants.NodeId.FAVORITES;
        });
        if (nonFolderNodes.length === 0) {
          return CommandModel.prototype.enabled.call(this, status, options);
        } else {
          var flag = CommandModel.prototype.enabled.call(this, _.defaults({
            nodes: new NodeCollection(nonFolderNodes)
          }, status), options);
          return flag;
        }
      }
      return false;
    },
    execute: function(status) {
      status.suppressSuccessMessage = true;
      var me = this;
      if (this._checkZipCondition(status)) {
        me._zipAndDownload(status);
        return $.Deferred().resolve().promise();
      } else {
        var node = CommandHelper.getJustOneNode(status);
        return this._downloadContent(node);
      }
    },
    _checkZipCondition: function(status) {
      if (status.nodes && status.nodes.length && status.nodes.length > 1) {
        return true;
      } else {
        var node = CommandHelper.getJustOneNode(status);
        return _.contains([ constants.Types.FOLDER, constants.Types.BWS ], node.get("type"));
      }
    },
    _zipAndDownload: function(status) {
      var deferred = $.Deferred(), me = this;
      var options = {
        status: status,
        c2Override: this.get("c2_override") ? this.get("c2_override") : false
      };
      require([ "d2/dialogs/zipanddownload/zip.download.dialog" ], function(ZipDownloadDialog) {
        var dialog = new ZipDownloadDialog(_.extend({
          command: me,
          status: status,
          defaultName: zipDownloadUtils._getDefaultZipFileName(status)
        }, options));
        dialog.show().done(function() {
          deferred.resolve();
        }).fail(function(error) {
          if (error === "cancel") {
            deferred.resolve();
          } else {
            deferred.reject();
          }
        });
      });
      return deferred.promise();
    },
    _downloadContent: function(node, downloadPathForWSCTF) {
      var me = this;
      if (base.isAppleMobile() && !utils.isAppworks()) {
        me._downloadWindow = window.open("");
      }
      return me.fetchDownloadUrls(node).done(function(downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath) {
        if (ctfBridge.isCtfEnabled()) {
          var openfile = false;
          if (!downloadLocationPath.checkout && downloadPathForWSCTF) {
            downloadLocationPath.checkout = downloadPathForWSCTF;
          }
          return me._performDownloadUsingWsCtf(downloadUrls, node, ctfConstants.OpType.EXPORT, ctfConstants.Mode.EXPORT, false, openfile, false, downloadLocationPath.checkout);
        } else {
          return me._performDownload(downloadUrls);
        }
      });
    },
    getDownloadLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.get("signature"));
    },
    fetchDownloadUrls: function(node, downloadLink) {
      var deferred = $.Deferred(), href = downloadLink ? downloadLink : this.getDownloadLink && this.getDownloadLink(node);
      if (!href) {
        deferred.reject(new CommandError("Missing linkrel for download action"));
      } else {
        var headers = {};
        headers[commonConstants.Headers.TIME_ZONE] = formatUtils.getBrowserTimeZone();
        $.ajax(node.connector.extendAjaxOptions({
          url: href,
          headers: headers,
          success: function(response) {
            var downloadUrls = [];
            var pageServingUrls = [];
            var bravacsrSearchInfoUrl = "";
            var bravacsrSearchInfoFallbackUrl = "";
            var downloadLocationPath = {
              checkout: response.download_location_checkout,
              view: response.download_location_view
            };
            var pageCount = -1;
            var formats = [];
            if (response.entries && response.entries[0] && response.entries[0]["content"]) {
              node.set("isPreviewProtected", response.entries[0]["content"]["drm_protection_enabled"]);
            }
            _.each(response.entries, function(entry) {
              if (entry.content.pageServingUrl) {
                pageCount = entry.content.pageCount;
                pageServingUrls.push(entry.content.url);
              } else {
                downloadUrls.push(entry.content.url);
              }
              formats.push(entry.content.format);
            });
            _.each(response.links, function(link) {
              if (link.rel === "d2-bravacsr-searchinfo-url") {
                bravacsrSearchInfoUrl = link.href;
              } else if (link.rel === "d2-bravacsr-searchinfo-fallback-url") {
                bravacsrSearchInfoFallbackUrl = link.href;
              }
            });
            deferred.resolve(downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath);
          },
          error: function(xhr, textStatus, errorThrown) {
            var error = new CommandError(xhr);
            if (utils.isMobile() && error.statusCode === 0) {
              deferred.reject(error);
            } else {
              var errorData = utils.parseAjaxError(xhr, textStatus, errorThrown), msg = errorData.message;
              if (msg.indexOf("<failure") >= 0) {
                msg = msg.substring(msg.indexOf("<failure"));
                var xmlDoc = $(msg);
                errorData.message = xmlDoc.attr("message");
              }
              deferred.reject(new CommandError(errorData));
            }
          }
        }));
      }
      return deferred.promise();
    },
    _getUserPreferences: function() {
      return RestResources.getCurrentUser().get("preferences");
    },
    _getDownloadPathForWsCtf: function(optype) {
      var downloadPath;
      var pref = this._getUserPreferences();
      if (optype === ctfConstants.OpType.VIEW) {
        downloadPath = pref[commonConstants.UserSettings.DOWNLOAD_VIEW_PATH];
      } else if (optype === ctfConstants.OpType.CHECKOUT || optype === ctfConstants.OpType.OPEN_CHECKEDOUT) {
        downloadPath = pref[commonConstants.UserSettings.DOWNLOAD_CHECKOUT_PATH];
      }
      return downloadPath;
    },
    _publishDownloadPathForWsCtf: function(title, mode, startPath, success, failure) {
      ctfBridge.publishSelectFolder(title, mode, startPath, success, failure);
    },
    _updateUserSettings: function(optype, path, connector) {
      var deferred = $.Deferred();
      var isViewOrCheckout = optype === ctfConstants.OpType.VIEW || optype === ctfConstants.OpType.CHECKOUT;
      if (isViewOrCheckout) {
        var userpref = {};
        if (optype === ctfConstants.OpType.VIEW) {
          userpref[commonConstants.UserSettings.DOWNLOAD_VIEW_PATH] = path;
        } else if (optype === ctfConstants.OpType.CHECKOUT) {
          userpref[commonConstants.UserSettings.DOWNLOAD_CHECKOUT_PATH] = path;
        }
        userSettingsUtils.updateUserSettings(userpref, {
          connector: connector
        }).done(function() {
          deferred.resolve();
        }).fail(function(err) {
          deferred.reject(err);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    _performDownloadUsingWsCtf: function(downloadUrls, node, optype, mode, silent, openfile, rejectOnLocalStorageError, downloadPath) {
      var remainingUrls = typeof downloadUrls === "string" ? [ downloadUrls ] : downloadUrls;
      var downloadurlsCopy = remainingUrls.slice(0);
      var deferred = $.Deferred();
      var updateUserSettings = _.bind(this._updateUserSettings, this);
      var publishDownloadPathForWsCtf = _.bind(this._publishDownloadPathForWsCtf, this);
      var localStorageErr = false;
      function downloadFailureLocalStorageError() {
        if (rejectOnLocalStorageError) {
          deferred.reject(new Error(_.str.sformat(d2lang.DownloadFailLocalStorageMessage, node.get("name"), downloadPath)));
          return;
        }
        localStorageErr = true;
        var title = "", startPath = "";
        publishDownloadPathForWsCtf(title, mode, startPath, success, failure);
      }
      function success(path) {
        if (!downloadPath || localStorageErr) {
          updateUserSettings(optype, path, node.connector).done(function() {
            publishDownload();
          }).fail(function(err) {
            GlobalMessage.showMessage("error", err.message);
          });
        } else {
          publishDownload();
        }
        function downloadSuccess() {
          if (!silent) {
            var msg = _.str.sformat(d2lang.DownloadSuccessMessage, path);
            GlobalMessage.showMessage("success", msg);
          }
          deferred.resolve();
        }
        function downloadFailure(errData) {
          if (remainingUrls.length > 0) {
            publishDownload();
          } else {
            if (!silent) {
              GlobalMessage.showMessage("error", d2lang.DownloadFailMessage, errData && JSON.parse(errData).details);
            }
            deferred.reject(new Error(d2lang.DownloadFailMessage));
          }
        }
        function downloadProgress(data) {
          deferred.notify({
            id: node.get("id"),
            done: data.downloaded,
            total: data.total
          });
        }
        function publishDownload() {
          var url;
          if (localStorageErr) {
            url = downloadurlsCopy[0];
          } else {
            url = remainingUrls[0];
            remainingUrls.shift();
          }
          var openFile = optype === ctfConstants.OpType.VIEW || openfile ? true : false;
          if (optype === ctfConstants.OpType.CHECKOUT || optype === ctfConstants.OpType.VIEW || optype === ctfConstants.OpType.EXPORT) {
            ctfBridge.publishDownload(node.get("id"), url, optype, openFile, path, downloadSuccess, downloadFailure, downloadFailureLocalStorageError, downloadProgress);
          } else {
            ctfBridge.openFileFromCheckout(node.get("id"), path, downloadSuccess, downloadFailure, downloadFailureLocalStorageError, downloadProgress).then(function() {
              deferred.resolve();
            }).catch(function() {
              deferred.reject();
            });
          }
        }
      }
      downloadPath = downloadPath || this._getDownloadPathForWsCtf(optype);
      function failure(err) {
        if (err) {
          Alert.showError(d2lang.SelectResourceFailMessage);
          deferred.reject(new Error(d2lang.SelectResourceFailMessage));
        } else {
          deferred.resolve();
        }
      }
      if (!downloadPath) {
        var title = "", startPath = "";
        this._publishDownloadPathForWsCtf(title, mode, startPath, success, failure);
      } else {
        ctfBridge.publishCreateDirectory(downloadPath, _.bind(function(isValid) {
          if (isValid) {
            success(downloadPath);
          } else {
            downloadPath = null;
            this._publishDownloadPathForWsCtf(title, mode, startPath, success, failure);
          }
        }, this));
      }
      return deferred.promise();
    },
    _performDownload: function(urls) {
      DownloadManager.downloadFile(urls, function(event, doc) {
        var responseData;
        try {
          responseData = doc && JSON.parse($(doc).text());
        } catch (err) {
          log.error("Error while parsing response", err);
        }
        var msg = responseData ? utils.parseErrorAsString("object", responseData) : d2lang.DownloadFailMessage;
        Alert.showError(msg);
      }, this._downloadWindow);
    }
  });
  return DownloadCommand;
});