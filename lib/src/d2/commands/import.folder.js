/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/models/command", "nuc/models/node/node.model", "nuc/models/nodes", "csui/models/fileupload", "csui/models/fileuploads", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "csui/utils/commandhelper", "csui/utils/taskqueue", "nuc/utils/url", "nuc/utils/base", "dctmw/server.adaptors/converters/node", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "dctmw/utils/utils", "d2/utils/creation.utils", "d2/utils/rest.linkrels", "d2/utils/constants", "d2/utils/format.utils", "i18n!d2/commands/nls/localized.strings", "i18n!d2/overrides/csui/controls/draganddrop/impl/nls/lang" ], function(require, $, _, Backbone, CommandModel, NodeModel, NodeCollection, FileUploadModel, UploadFileCollection, GlobalMessage, ModalAlert, CommandHelper, TaskQueue, Url, base, nodeConverter, NodeCreationSuccessMessageView, utils, CreationUtils, RestLinkrels, constants, formatUtils, lang, dndLang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-ImportFolder",
      command_key: "D2-ImportFolder",
      name: lang.CommandNameImportFolder,
      pageLeavingWarning: lang.ImportFolderPageLeavingWarning,
      scope: "single"
    },
    enabled: function(status, options) {
      if (base.isIE11() || base.isAppleMobile() || utils.isMobile()) {
        return false;
      }
      var menuType;
      if (status.toolItem) {
        var props = status.toolItem.get("actionProperties");
        menuType = props && props.menuType;
      }
      if (menuType === constants.MenuTypes.NEW_OBJECT || menuType === constants.MenuTypes.BWS_NEW_OBJECT) {
        if (status.container) {
          var nodes = new NodeCollection([ status.container ]), newStatus = _.defaults({
            nodes: nodes
          }, status);
          return CommandModel.prototype.enabled.call(this, newStatus, options);
        } else {
          console.warn("Container should be defined.");
        }
      } else {
        if (status.nodes && status.nodes.length === 1) {
          var node = CommandHelper.getJustOneNode(status);
          if (node) {
            return CommandModel.prototype.enabled.call(this, status, options);
          }
        }
      }
      return false;
    },
    execute: function(status, options) {
      var me = this, deferred = $.Deferred();
      if (options && options.files) {
        if (options.files.length) {
          me._launchWizard(status, options.files).done(deferred.resolve).fail(function() {
            deferred.reject();
          });
        } else {
          GlobalMessage.showMessage("error", dndLang.emptyFolderDrop);
        }
      } else {
        me._selectFolder().done(function(files) {
          me._launchWizard(status, files).then(CreationUtils.refreshSelection).done(deferred.resolve).fail(function() {
            deferred.reject();
          });
        }).fail(function() {
          deferred.resolve();
        });
      }
      if (status.returnCommandPromise === true) {
        return deferred.promise();
      }
    },
    _selectFolder: function() {
      var deferred = $.Deferred(), inputEl = $("#d2folderselection");
      if (inputEl.length === 0) {
        inputEl = $('<input type="file" id= "d2folderselection" style="display:none" webkitdirectory directory>').appendTo("body");
      }
      inputEl.off("change");
      inputEl.on("change", function(event) {
        var origEv = event.originalEvent, files = origEv.target.files || origEv.dataTransfer && origEv.dataTransfer.files;
        deferred.resolve(files);
        inputEl.remove();
      });
      inputEl.trigger("click");
      inputEl.trigger("focus");
      return deferred.promise();
    },
    _launchWizard: function(status, files) {
      var deferred = $.Deferred(), action = this, connector = status.context.getObject("connector"), node = new NodeModel(undefined, {
        context: status.context,
        connector: connector
      }), sourceContentNode = this._getSourceContentNode(status), landingPageInheritedNode = this._getLandingPageInheritedNode(status, connector);
      status.successFiles = [];
      status.failedFiles = [];
      require([ "d2/dialogs/import.folder/import.folder.dialog" ], function(ImportFolderDialog) {
        var options = {
          command: action,
          node: node,
          inheritableSourceNode: sourceContentNode || landingPageInheritedNode,
          container: status.container,
          status: status,
          files: files,
          action: "import",
          formMode: "create",
          operationType: "import",
          connector: connector,
          importFixedFile: !!status.importFixedFile,
          suppressD2SuccessMessage: status.suppressD2SuccessMessage,
          suppressD2FailMessage: status.suppressD2FailMessage,
          suppressD2FailMessageSummary: status.suppressD2FailMessageSummary,
          suppressD2ProgressBar: status.suppressD2ProgressBar
        };
        var dialog = new ImportFolderDialog(options);
        if (dialog.options.files.length === 0) {
          ModalAlert.showInfo(lang.ImportFolderNoValidFilesInFolder);
        } else {
          dialog.show().done(function() {
            if (status.folderUploadModels && status.folderUploadModels.length > 0 && status.folderStructureCreated) {
              if (!_.isUndefined(status.vdocNode) && node.profileData.folderSelectionModel && node.profileData.folderSelectionModel.get("properties")["convert_to_vd"]) {
                action.performVdocConversion(status, action, dialog).done(deferred.resolve).fail(deferred.reject);
              } else if (status.suppressD2ProgressBar === true) {
                if (!status.suppressD2SuccessMessage) {
                  var message = _.str.sformat(lang.ImportOneFolderSuccessMessage, status.node.get("name"));
                  action._showMsg(status, status.node, message, !action.isNodePresentInCurrentContainer(status));
                }
                deferred.resolve();
              }
            } else if (status.folderStructureError) {
              action.showGlobalErrorMessage(status.folderStructureError, status);
              deferred.reject();
            } else {
              status.node = node;
              action.performFolderUploadAction(status, action, dialog).done(deferred.resolve).fail(deferred.reject);
            }
          }).fail(function(error) {
            action.showGlobalErrorMessage(error, status);
            status.folderStructureError = error;
            deferred.reject(error);
          });
        }
      });
      return deferred.promise();
    },
    performVdocConversion: function(status, action, dialog) {
      var waitForVdocConversionStatus = $.Deferred();
      var vdCreationModel = new FileUploadModel({
        name: status.folderUploadModels.models[0].get("name"),
        state: "pending",
        count: 0,
        total: 1,
        doneCommand: {
          signature: "D2-GoToLocation",
          label: lang.ImportFolderDoneCommandLabel
        },
        context: status.context,
        commandContainer: status.container,
        originatingView: status.originatingView
      }, {
        node: status.vdocNode
      });
      status.vdocNode.set({
        i_contents_id: "0000000000000000",
        rIsVirtualDoc: true
      });
      status.folderUploadModels.add(vdCreationModel);
      if (status.suppressD2ProgressBar === true) {
        if (status.originatingView && status.originatingView.blockActions) {
          status.originatingView.blockActions();
        }
      } else {
        action.showProgressMessages(status.folderUploadModels, dialog, {
          oneFilePending: lang.FolderConversionToVdocProgress,
          oneFileSuccess: lang.FolderConversionToVdocComplete,
          multiFileOneFailure: lang.FolderConversionToVdocFailed
        }, status);
      }
      if (status.folderVDConversionFailed && status.folderStructureError) {
        var errorMessage, error = status.folderStructureError;
        if (error) {
          if (_.isString(error)) {
            errorMessage = error;
          } else if (error.responseText) {
            errorMessage = utils.parseAjaxErrorAsString(error);
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
        vdCreationModel.set({
          count: 1,
          state: "rejected",
          errorMessage: errorMessage
        });
        waitForVdocConversionStatus.resolve();
      } else {
        require([ "d2/commands/convert.to.vdoc.folder" ], function(convertVdocCommand) {
          var vdocStatus = _.clone(status);
          vdocStatus.nodes = new Backbone.Collection([ status.node ]);
          vdocStatus.node = status.vdocNode;
          var vdocConversionStatus = new convertVdocCommand().execute(vdocStatus);
          vdocConversionStatus.done(function() {
            if (status.suppressD2ProgressBar === true) {
              if (status.originatingView && status.originatingView.unblockActions) {
                status.originatingView.unblockActions();
              }
            }
            vdCreationModel.set({
              count: 1,
              state: "resolved"
            });
            waitForVdocConversionStatus.resolve();
          });
        });
      }
      return waitForVdocConversionStatus.promise();
    },
    performFolderUploadAction: function(status, action, dialog) {
      var uploadAction = $.Deferred(), model, me = this;
      action.getFileUploadModels(status, dialog).then(function() {
        model = status.folderUploadModels.at(0);
        action.showProgressMessages(status.folderUploadModels, dialog, undefined, status);
        return action._performAction(model, null, status);
      }).done(function() {
        const disAllowedFiles = dialog.options.disAllowedFiles;
        if (!(disAllowedFiles && disAllowedFiles.length > 0)) {
          const isNodePresentInCurrentContainer = me.isNodePresentInCurrentContainer(status);
          model.set({
            count: model.get("total"),
            state: "resolved",
            targetLocation: !isNodePresentInCurrentContainer === false ? undefined : !isNodePresentInCurrentContainer
          });
        }
        uploadAction.resolve();
      }).fail(function(error) {
        model.set({
          count: model.get("total"),
          state: "rejected"
        });
        uploadAction.reject(error);
      });
      return uploadAction.promise();
    },
    getFileUploadModels: function(status, dialog) {
      var folderUploadModel = $.Deferred();
      var node = status.node;
      var disAllowedFiles = dialog && dialog.options && dialog.options.disAllowedFiles ? dialog.options.disAllowedFiles : [];
      var selectedFolderConfig = node.profileData.folderSelectionModel;
      var importUrls = RestLinkrels.getLink(selectedFolderConfig.get("links"), RestLinkrels.D2_FOLDER_STRUCTURE_IMPORT_URLS);
      var queryParams = {
        "folder-import-config": node.profileData.get("folder-structure-config-id"),
        "link-id": node.profileData.get("link-id"),
        "profile-value-config-id": node.profileData.get("profile-value-config-id"),
        "inherit-properties": node.profileData.get("inherit-properties"),
        "inherited-id": node.profileData.get("inherited-id")
      };
      if (status.dontCreateFolders === true) {
        queryParams["dontCreateFolders"] = true;
      }
      this.getImportFolderStructureUrl(node, importUrls, disAllowedFiles).done(function(response) {
        var urls = _.map(response.entries, function(entry) {
          var url;
          if (entry.content && entry.content.url) {
            url = Url.appendQuery(entry.content.url, Url.combineQueryString(queryParams));
          }
          return url;
        });
        var files = node.get("files");
        var rootFolderName = node.get("rootFolderName");
        node.set("name", rootFolderName);
        node.set("type", 0);
        var importFolderModel = new FileUploadModel({
          name: rootFolderName,
          state: "pending",
          count: 0,
          total: _.reduce(files, function(memo, file) {
            var fileSize = file.pluginMode === constants.BrowserPluginMode.WSCTF ? 100 : file.size;
            return memo + (fileSize || 1);
          }, 0) + 1,
          uploadUrls: urls,
          context: status.context,
          status: status,
          doneCommand: {
            signature: "D2-GoToLocation",
            label: lang.ImportFolderDoneCommandLabel
          },
          originatingView: status.originatingView,
          commandContainer: status.container
        }, {
          node: node
        });
        status.folderUploadModels = new UploadFileCollection([ importFolderModel ], {
          connector: node.connector
        });
        CreationUtils.addDisallowedFilesToModels(this, disAllowedFiles, status.folderUploadModels);
        folderUploadModel.resolve();
      });
      return folderUploadModel.promise();
    },
    _performAction: function(model, taskQueue, status) {
      var node = model.node;
      if (node.get("files") && node.get("files").length > 0) {
        var performAction = $.Deferred();
        var urls = model.get("uploadUrls");
        var me = this;
        var files = node.get("files");
        var parallelism = files && files[0] && files[0].pluginMode === constants.BrowserPluginMode.WSCTF ? 1 : 3;
        var fileUploadpromises = [];
        var folderStructureMap = new Map();
        var queue = taskQueue || new TaskQueue({
          parallelism: parallelism
        });
        _.each(files, function(file) {
          var fileUploadQueueItem = $.Deferred();
          queue.pending.add({
            worker: function() {
              if (file.pluginMode === constants.BrowserPluginMode.WSCTF) {
                file.id = file.relativePath;
              } else {
                file.id = file.path ? file.path : file.webkitRelativePath;
              }
              me.uploadFile(node, file, urls).progress(function(values) {
                if (values && values.id) {
                  var totalDone = 0;
                  _.each(node.get("files"), function(f) {
                    if (f.id === values.id) {
                      f.bytesDone = values.done;
                    }
                    totalDone += f.bytesDone || 0;
                  });
                  model.set({
                    count: totalDone
                  });
                }
                performAction.notify(totalDone);
              }).done(function(response) {
                var fileObj = {
                  filePath: file.id,
                  fileId: response["properties"]["fileId"]
                };
                me._addToFolderStructureMap(folderStructureMap, fileObj);
                model.set({
                  state: "processing"
                });
                status.successFiles.push({
                  file: file
                });
                fileUploadQueueItem.resolve();
              }).fail(function(error) {
                status.failedFiles.push({
                  file: file,
                  error: error
                });
                fileUploadQueueItem.reject(error);
              });
              return fileUploadQueueItem.promise();
            }
          });
          fileUploadpromises.push(fileUploadQueueItem);
        });
        $.when.apply($, fileUploadpromises).done(function() {
          me.sendFolderStructure(node, folderStructureMap, urls, node.connector, status).then(function() {
            return me.addLocalNodeToContainerCollection(model.get("status"));
          }).done(function() {
            status.folderStructureCreated = true;
            performAction.resolve();
          }).fail(function(error) {
            status.folderStructureError = error;
            performAction.reject(error);
          });
        }).fail(function(error) {
          status.folderStructureError = lang.ImportFolderFileUploadError;
          performAction.reject(error);
        });
        return performAction.promise();
      }
    },
    uploadFile: function(nodeModel, file, urls) {
      urls = _.clone(urls);
      var dfd = $.Deferred(), promise;
      if (file && file.pluginMode === constants.BrowserPluginMode.WSCTF) {
        promise = CreationUtils.uploadFileUsingCTF(file.id, file, urls);
      } else {
        promise = CreationUtils.uploadFile(nodeModel.connector, file, urls);
      }
      promise.progress(dfd.notify).done(dfd.resolve).fail(dfd.reject);
      return dfd.promise();
    },
    sendFolderStructure: function(node, folderStructureMap, urls, connector, status) {
      var sendFolderStructureConfig = $.Deferred();
      var me = this;
      var folderstructure = {
        "folder-structure": []
      };
      folderStructureMap.forEach(function(file) {
        var obj = {
          name: file.name,
          path: file.path
        };
        if (file.isDirectory && file.isRootDirectory) {
          obj["isRootFolder"] = "true";
        }
        if (file.fileId) {
          obj["fileId"] = file.fileId;
        }
        folderstructure["folder-structure"].push(obj);
      });
      urls = _.clone(urls);
      urls = _.map(urls, function(url) {
        if (url) {
          url = Url.appendQuery(url, Url.combineQueryString({
            last: true
          }));
        }
        return url;
      });
      var propertiesData = {
        metadata: CreationUtils.getCreateObjectRequestPayload(node)
      };
      var file;
      if (base.isEdge()) {
        file = new Blob([ JSON.stringify(folderstructure) ], {
          type: "application/json"
        });
        file = me.blobToFile(file, "FolderStructure.json");
      } else {
        var blob = new Blob([ JSON.stringify(folderstructure) ]);
        file = new File([ blob ], "FolderStructure.json", {
          type: "application/json"
        });
      }
      var uploadPromise = CreationUtils.uploadFile(connector, file, urls, propertiesData);
      uploadPromise.done(function(response) {
        node.set("links", response.links);
        node.set("id", response.properties["r_object_id"]);
        status.folderStructureResponse = response;
        sendFolderStructureConfig.resolve();
      }).fail(function(error) {
        sendFolderStructureConfig.reject(error);
      });
      return sendFolderStructureConfig.promise();
    },
    _addToFolderStructureMap: function(map, fileObj) {
      var filePathAry = fileObj.filePath.split("/");
      _.each(filePathAry, function(element, index, list) {
        var file = {};
        var key = list.slice(0, index + 1).join("/");
        if (!map.has(key)) {
          var path = list.slice(1, index);
          file.path = path.join("/");
          file.name = element;
          if (index === list.length - 1) {
            file.fileId = fileObj.fileId;
            file.isDirectory = false;
          } else {
            file.isRootDirectory = index === 0;
            file.isDirectory = true;
          }
          map.set(key, file);
        }
      });
    },
    addLocalNodeToContainerCollection: function(status) {
      var widgetConfig = {};
      if (status.container && status.container.get("id") && status.collection && status.collection.options) {
        widgetConfig.widgetType = status.collection.widgetType;
        widgetConfig.widgetName = status.collection.options.widgetName;
      }
      var p = $.Deferred(), me = this;
      delete status.node.propertiesSource;
      CommandHelper.refreshNode(status.node, widgetConfig).always(function() {
        status.node.set("mime_type", status.node.get("type"));
        if (me.isNodePresentInCurrentContainer(status)) {
          status.node.isLocallyCreated = true;
          status.node.collection = status.collection;
          status.collection && status.collection.unshift(status.node);
        }
        p.resolve();
      });
      return p.promise();
    },
    isNodePresentInCurrentContainer: function(status) {
      var parentIds = status.node.get("i_folder_id");
      return status.container && _.contains(parentIds, status.container.get("id"));
    },
    getImportFolderStructureUrl: function(node, importUrls) {
      var deferred = $.Deferred();
      var headers = {
        "Content-Type": constants.MediaTypes.DCTM_JSON
      };
      headers[constants.Headers.TIME_ZONE] = formatUtils.getBrowserTimeZone();
      var ajaxOptions = node.connector.extendAjaxOptions({
        url: importUrls,
        type: "GET",
        headers: headers,
        success: function(response) {
          deferred.resolve(response);
        },
        error: function(request, textStatus, error) {
          deferred.reject(error);
        }
      });
      $.ajax(ajaxOptions);
      return deferred.promise();
    },
    showProgressMessages: function(importCollection, dialog, options, status) {
      options = options || {
        oneFilePending: lang.ImportingOneFolder,
        oneFileSuccess: lang.ImportOneFolderSuccessMessage,
        oneFileFailure: lang.ImportOneFolderFailureMessage,
        actionType: "UPLOAD",
        link_command_signature: "Browse",
        doAutoClose: true,
        commandContainer: status.container,
        configOptions: {
          enhancePanel: importCollection.length > 1
        },
        context: status.context
      };
      dialog.progressPanel = GlobalMessage.showProgressPanel(importCollection, options);
    },
    showGlobalErrorMessage: function(error, status) {
      if (status && status.suppressD2FailMessage === true) {
        return;
      }
      if (error) {
        if (_.isString(error)) {
          GlobalMessage.showMessage("error", error);
        } else {
          error.responseJSON = error.responseJSON || {};
          GlobalMessage.showMessage("error", error.responseJSON.message, error.responseJSON.details);
        }
      }
    },
    _showMsg: function(status, node, msg, showLink, disAllowedFiles) {
      GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
        showLink: showLink,
        node: node,
        context: status.context,
        successMessageFormat: msg,
        linkLabel: lang.ImportFolderDoneCommandLabel,
        originatingView: status.originatingView,
        link_command_signature: "D2-GoToLocation",
        disAllowed_files: disAllowedFiles
      });
    },
    _getSourceContentNode: function(status) {
      var node;
      if (status) {
        node = CommandHelper.getJustOneNode(status);
        if (!node && status.container && !nodeConverter.isNonDCTMNode(status.container)) {
          node = status.container;
        }
      }
      return node;
    },
    _getLandingPageInheritedNode: function(status, connector) {
      var node;
      if (status && status.landingPageId) {
        node = new NodeModel({
          id: status.landingPageId
        }, {
          context: status.context,
          connector: connector
        });
      }
      return node;
    },
    onCancel: function() {
      return CreationUtils.showCancelAlertForImport.call(this, lang.ImportFolderCancelAlertMessage, "", lang.CreateCancelAlertButtonLabelYes, true);
    },
    blobToFile: function(theBlob, fileName) {
      theBlob.lastModifiedDate = new Date();
      theBlob.name = fileName;
      return theBlob;
    }
  });
});