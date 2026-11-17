/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url", "nuc/utils/base", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "nuc/models/node/node.model", "csui/dialogs/modal.alert/modal.alert", "d2/models/creation.presets.value.config", "d2/models/creation.presets.value.configs", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/format.utils", "dctmw/server.adaptors/converters/node", "d2/ctf/ctfBridge", "d2/utils/validator/base.content.upload.validator", "i18n!d2/utils/impl/nls/lang" ], function($, _, Backbone, Url, base, ConnectorFactory, CommandHelper, NodeModel, Alert, PresetValueConfigModel, PresetValueConfigCollection, RestLinkrels, RestResources, constants, utils, formatUtils, nodeConverter, ctfBridge, BaseContentUploadValidator, lang) {
  "use strict";
  function showConfirmationAlert(title, message, yesButtonLabel, cancelButtonLabel, hasTitle) {
    var dfd = $.Deferred(), buttonOptions = {
      showYes: true,
      labelYes: yesButtonLabel,
      showNo: false,
      showCancel: true
    };
    hasTitle = _.isBoolean(hasTitle) ? hasTitle : false;
    if (_.isString(cancelButtonLabel) && !_.isEmpty(cancelButtonLabel)) {
      buttonOptions["labelCancel"] = cancelButtonLabel;
    }
    Alert.confirmQuestion(function(result) {
      if (result) {
        dfd.resolve();
      } else {
        dfd.reject("cancel");
      }
    }, hasTitle ? message : "", hasTitle ? title : message, {
      buttons: buttonOptions
    });
    return dfd.promise();
  }
  function showErrorAlert(title, message, okButtonLabel) {
    var dfd = $.Deferred(), buttonOptions = Alert.buttons.Ok;
    if (_.isString(okButtonLabel) && !_.isEmpty(okButtonLabel)) {
      buttonOptions["labelYes"] = okButtonLabel;
    }
    Alert.confirmError(function(result) {
      if (result) {
        dfd.resolve();
      } else {
        dfd.reject();
      }
    }, message, title, {
      buttons: buttonOptions
    });
    return dfd.promise();
  }
  return {
    initiateImport: function(nodeModel, finishOperation, mode, options = {}) {
      var me = this;
      var dfd = $.Deferred();
      $.when(me.createObject(nodeModel, mode || "import")).then(function() {
        var objectId = nodeModel.get("id"), name = nodeModel.get("name"), contentSize = nodeModel.contentFile.size, linkId = options.targetLocation ? options.targetLocation : nodeModel.profileData.get("link-id"), format = nodeModel.get("a_content_type");
        if (mode && mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
          if (finishOperation === true) {
            me.finishCreateOperation([ nodeModel ], RestLinkrels.FINISH_ACTION).always(function() {
              dfd.resolve(nodeModel);
            });
          } else {
            dfd.resolve(nodeModel);
          }
        } else {
          $.when(me.getUploadUrlsForObject(nodeModel, objectId, name, contentSize, linkId, format)).then(function(response) {
            if (response && response.entries && response.entries.length > 0) {
              var isO2Applicable = me.hasO2Properties(nodeModel), uploadUrls = _.map(response.entries, function(entry) {
                var url;
                if (entry.content && entry.content.url) {
                  url = entry.content.url;
                  if (isO2Applicable) {
                    url = Url.appendQuery(url, Url.combineQueryString({
                      ticket_id: nodeModel.get("o2-ticket-id")
                    }));
                  }
                }
                return url;
              });
              me.setFileForObject(nodeModel, uploadUrls, isO2Applicable, options).progress(dfd.notify).done(function() {
                if (finishOperation === true) {
                  me.finishCreateOperation([ nodeModel ], RestLinkrels.FINISH_ACTION).always(function() {
                    dfd.resolve(nodeModel);
                  });
                } else {
                  dfd.resolve(nodeModel);
                }
              }).fail(function(error) {
                me.finishCreateOperation([ nodeModel ], RestLinkrels.ABORT_ACTION);
                dfd.reject(error);
              });
            }
          }, function(error) {
            me.finishCreateOperation([ nodeModel ], RestLinkrels.ABORT_ACTION);
            dfd.reject(error);
          });
        }
      }, function(error) {
        me.finishCreateOperation([ nodeModel ], RestLinkrels.ABORT_ACTION);
        dfd.reject(error);
      });
      return dfd.promise();
    },
    createObject: function(nodeModel, mode) {
      var dfd = $.Deferred(), me = this;
      var url = RestLinkrels.getLink(nodeModel.profileData.data.get("valueConfig").get("links"), RestLinkrels.D2_OBJECT_CREATION), isSingleRepoPaste = false, profile = nodeModel.profileData.data, recentProfileCollection = nodeModel.profileData.recentProfileCollection, customName = profile.get("custom_name"), presetName = "", presetValueName = "", presetModel = profile.presetModel;
      if (mode && mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
        isSingleRepoPaste = true;
        mode = "import";
      }
      var urlParamMap = {
        mode: mode,
        "inprocess-object": true
      };
      if (nodeModel.profileData.get("link-id")) {
        urlParamMap["link-id"] = nodeModel.profileData.get("link-id");
      }
      if (nodeModel.profileData.get("inherited-id")) {
        urlParamMap["inherited-id"] = nodeModel.profileData.get("inherited-id");
        _.extend(urlParamMap, {
          "inherit-content": !!nodeModel.profileData.get("inherit-content"),
          "inherit-properties": !!nodeModel.profileData.get("inherit-properties"),
          "inherit-vd": !!nodeModel.profileData.get("inherit-vd")
        });
      }
      if (profile.canBeUsedForCreate() || profile.canBeUsedForImport()) {
        if (presetModel) {
          presetValueName = presetModel.get("object_name");
          presetName = presetValueName && presetModel.preset && presetModel.preset.get("object_name") || "";
          if (presetModel.isEdited === true) {
            if (!customName || customName === presetModel.get("name")) {
              customName = this.getGeneratedCustomProfileName(presetModel.get("name") || profile.get("name"), recentProfileCollection);
            }
          } else {
            if (!customName) {
              customName = profile.isDefaultCustomName === undefined || profile.isDefaultCustomName === true ? presetModel.get("name") || presetModel.get("object_name") || profile.get("name") : profile.get("name");
            }
          }
        } else {
          if (!customName) {
            customName = profile.isEdited ? me.getGeneratedCustomProfileName(profile.get("name"), recentProfileCollection) : profile.get("name");
          }
        }
        if (customName) {
          urlParamMap["custom-profile-name"] = customName;
        }
        if (presetName) {
          urlParamMap["preset-profile-config-name"] = presetName;
        }
        if (presetValueName) {
          urlParamMap["preset-profile-value-name"] = presetValueName;
        }
      }
      if (nodeModel.isEmailAttachment === true) {
        urlParamMap["attachment-name"] = nodeModel.contentFile.name;
      } else if (nodeModel.contentFile) {
        urlParamMap["file-name"] = nodeModel.contentFile.name;
      }
      if (isSingleRepoPaste) {
        urlParamMap["paste-mode"] = constants.CreationProfileModes.SINGLE_REPO_PASTE;
        urlParamMap["source-object-id"] = nodeModel.get("id");
      }
      me.cleanupInvalidRecentProfiles(recentProfileCollection).always(function() {
        url = Url.appendQuery(url, Url.combineQueryString(urlParamMap));
        $.ajax(nodeModel.connector.extendAjaxOptions({
          url: url,
          type: "POST",
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          data: me.getCreateObjectRequestPayload(nodeModel),
          success: function(response) {
            var format = nodeModel.get("aContentType"), mimeType = nodeModel.get("mime_type");
            nodeModel._tokenId = response["token-id"];
            var nodeProp = nodeConverter.convertNode(response);
            nodeProp["mime_type"] = mimeType;
            nodeProp["a_content_type"] = format;
            if (me.hasO2Properties(nodeModel)) {
              nodeProp["o2-ticket-id"] = nodeModel.get("o2-ticket-id");
              nodeProp["o2-properties"] = nodeModel.get("o2-properties");
            }
            nodeModel.clear({
              silent: true
            });
            nodeModel.set(nodeProp, {
              silent: true
            });
            nodeModel._links = nodeModel.get("links");
            dfd.resolve(nodeModel);
          },
          error: function(xhr) {
            dfd.reject(xhr);
          }
        }));
      });
      return dfd.promise();
    },
    cleanupInvalidRecentProfiles: function(recentProfileCollection) {
      var dfd = $.Deferred(), me = this;
      var invalidProfiles = recentProfileCollection && recentProfileCollection.filter(function(rModel) {
        return rModel.isInvalid() && !rModel.isDeleted;
      });
      if (invalidProfiles && invalidProfiles.length) {
        var options = {
          connector: invalidProfiles[0].connector
        };
        options.operations = _.map(invalidProfiles, function(rModel) {
          return {
            id: rModel.get("id"),
            request: {
              method: "DELETE",
              uri: RestLinkrels.getLink(rModel.get("links"), RestLinkrels.DELETE)
            }
          };
        });
        me.deleteObjects(options).done(function() {
          _.each(invalidProfiles, function(rModel) {
            rModel.isDeleted = true;
          });
          dfd.resolve();
        }).fail(dfd.reject);
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    deleteObjects: function(options) {
      if (options.operations.length === 1) {
        var dfd = $.Deferred();
        $.ajax(options.connector.extendAjaxOptions({
          url: options.operations[0].request.uri,
          type: options.operations[0].request.method,
          success: function(response) {
            dfd.resolve(response);
          },
          error: function(xhr) {
            dfd.reject(xhr);
          }
        }));
        return dfd.promise();
      } else {
        return utils.makeBatchAjaxCall(options);
      }
    },
    getGeneratedCustomProfileName: function(preferredName, recentProfileCollection) {
      var simpleNamePattern = new RegExp(_.str.sformat(lang.GeneratedCustomProfileNameSimple, "") + "$"), numberedNamePattern = new RegExp(_.str.sformat(lang.GeneratedCustomProfileNameNumbered, "", "\\d+") + "$"), generatedName;
      if (preferredName.match(simpleNamePattern)) {
        generatedName = preferredName;
        preferredName = preferredName.replace(simpleNamePattern, "");
      } else if (preferredName.match(numberedNamePattern)) {
        preferredName = preferredName.replace(numberedNamePattern, "");
        generatedName = _.str.sformat(lang.GeneratedCustomProfileNameSimple, preferredName);
      } else {
        generatedName = _.str.sformat(lang.GeneratedCustomProfileNameSimple, preferredName);
      }
      if (recentProfileCollection instanceof PresetValueConfigCollection && recentProfileCollection.length) {
        var maxRank = _.chain(recentProfileCollection.filter(function(rModel) {
          return rModel.get("name").search(generatedName) !== -1;
        })).map(function(rModel) {
          var name = rModel.get("name").replace(new RegExp(generatedName, "g"), "");
          if (name === "") {
            return 2;
          }
          var pMatch = name.match(/(\d+)$/);
          if (pMatch && pMatch.length === 2) {
            return parseInt(pMatch[1]) + 1;
          }
          return 0;
        }).compact().sortBy().last().value();
        if (_.isNumber(maxRank)) {
          generatedName = _.str.sformat(lang.GeneratedCustomProfileNameNumbered, preferredName, maxRank);
        }
      }
      return generatedName;
    },
    getCreateObjectRequestPayload: function(nodeModel) {
      var payload = {};
      var properties = {};
      if (nodeModel.has("properties")) {
        properties = nodeModel.get("properties");
      }
      if (!_.has(properties, "r_object_type")) {
        properties["r_object_type"] = nodeModel.profileData.data.get("valueConfig").get("r_object_type");
      }
      payload["properties"] = properties;
      if (this.hasO2Properties(nodeModel) && !this.hasPropertyPage(nodeModel.profileData)) {
        payload["extracted-o2-properties"] = nodeModel.get("o2-properties");
      }
      payload = JSON.stringify(payload);
      return payload;
    },
    getUploadUrlsForObject: function(nodeModel, objectId, name, contentSize, linkId, format) {
      var dfd = $.Deferred();
      var url = RestLinkrels.getLink(nodeModel.get("links"), RestLinkrels.D2_CONTENT_UPLOAD_URLS);
      var fileNameSplit = name.split(".");
      if (fileNameSplit.length > 1) {
        fileNameSplit.pop();
      }
      var urlParams = {
        "content-size": contentSize,
        "link-id": linkId,
        format: format,
        inline: true
      };
      url = Url.appendQuery(url, Url.combineQueryString(urlParams));
      var headers = {};
      headers[constants.Headers.TIME_ZONE] = formatUtils.getBrowserTimeZone();
      $.ajax(nodeModel.connector.extendAjaxOptions({
        url: url,
        headers: headers,
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    setFileForObject: function(nodeModel, uploadUrls, isO2Applicable, options = {}) {
      var dfd = $.Deferred();
      var promise, file = isO2Applicable ? null : nodeModel.contentFile;
      if (nodeModel?.contentFile?.pluginMode === constants.BrowserPluginMode.WSCTF && file) {
        promise = this.uploadFileUsingCTF(nodeModel.get("id"), file, uploadUrls);
      } else {
        const extraFormData = {
          fileImportUrl: options.fileImportObject ? options.fileImportObject.fileImportUrl : "",
          token: options.bearerToken
        };
        promise = this.uploadFile(nodeModel.connector, file, uploadUrls, extraFormData);
      }
      promise.progress(dfd.notify).done((...args) => {
        if (nodeModel.contentFile && options.contentUploadValidator && options.contentUploadValidator instanceof BaseContentUploadValidator) {
          var response = args && args[0];
          options.contentUploadValidator.validateUploadedContent({
            operation: constants.ContentUploadOps.IMPORT,
            r_object_id: nodeModel.get("id"),
            file: nodeModel.contentFile,
            contentUploadResponse: response,
            node: nodeModel
          }).done(() => {
            dfd.resolve.apply(dfd, args);
          }).fail(dfd.reject);
        } else {
          dfd.resolve.apply(dfd, args);
        }
      }).fail(dfd.reject);
      return dfd.promise();
    },
    uploadFile: function(connector, file, urls, extraFormData, processData) {
      var me = this, url = urls;
      if (_.isArray(urls) && urls.length > 0) {
        url = urls.shift();
        if (urls.length > 0 && (_.isUndefined(processData) || _.isNull(processData))) {
          processData = {};
        }
      }
      let extraHeader = {};
      if (extraFormData?.fileImportUrl) {
        if (extraFormData.token) {
          extraHeader["X-D2-VIEWER-ACCESS-TOKEN"] = extraFormData.token;
          delete extraFormData.token;
        }
      }
      var dfd = $.Deferred(), ajaxOptions = connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: false,
        processData: false,
        xhrFields: {
          withCredentials: false
        },
        data: "",
        headers: extraHeader,
        success: function(response, responseText, xhr) {
          dfd.resolve(response, responseText, xhr);
        },
        error: function(xhr, textStatus, errorThrown) {
          if (_.isArray(urls) && urls.length > 0) {
            me.uploadFile(connector, file, urls, extraFormData, processData).progress(dfd.notify).done(dfd.resolve).fail(dfd.reject);
          } else {
            dfd.reject(xhr, textStatus, errorThrown);
          }
        }
      });
      if (file) {
        var formdata = new FormData();
        if (!extraFormData?.fileImportUrl) {
          file instanceof Blob ? formdata.append("uploadFile", file, file.name) : formdata.append("uploadFile", file);
        }
        if (extraFormData) {
          _.each(extraFormData, function(value, key) {
            formdata.append(key, value);
          });
        }
        ajaxOptions.data = formdata;
        ajaxOptions.xhr = function() {
          var xhr = $.ajaxSettings.xhr();
          xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
              if (processData) {
                if (processData.loaded > 0 && processData.loaded > event.loaded) {
                  return;
                }
                processData.loaded = event.loaded;
              }
              dfd.notify({
                id: file.id,
                done: event.loaded,
                total: event.total
              });
            }
          };
          return xhr;
        };
      }
      $.ajax(ajaxOptions);
      return dfd.promise();
    },
    uploadFileUsingCTF: function(sUid, file, urls, processData) {
      var me = this, dfd = $.Deferred(), filekey = "uploadFile", metadata = {}, metadatakey = "metadata", filePath = file && file.path, options = {}, url = urls;
      if (_.isArray(urls) && urls.length > 0) {
        url = urls.shift();
        if (urls.length > 0 && _.isUndefined(processData) || _.isNull(processData)) {
          processData = {};
        }
      }
      ctfBridge.publishUpload(sUid, filePath, url, "NONE", filekey, metadatakey, JSON.stringify(metadata), options, function(response) {
        dfd.resolve(response);
      }, function(err) {
        if (_.isArray(urls) && urls.length > 0) {
          me.uploadFileUsingCTF(sUid, file, urls, processData).progress(dfd.notify).done(dfd.resolve).fail(dfd.reject);
        } else {
          dfd.reject(err);
        }
      }, function(progress) {
        if (processData) {
          if (processData.loaded > 0 && processData.loaded > progress.loaded) {
            return;
          }
          processData.loaded = progress.loaded;
        }
        dfd.notify({
          id: file && file.id,
          done: progress.loaded,
          total: progress.total
        });
      });
      return dfd.promise();
    },
    updatePropertiesSourceInNode: function(nodeModel, operationType, mode) {
      var urlParamMap = {
        inline: true
      };
      if (operationType === "import") {
        urlParamMap["file-name"] = nodeModel.get("name");
        urlParamMap["mode"] = "import";
      } else {
        urlParamMap["mode"] = "create";
      }
      if (mode && mode === constants.CreationProfileModes.SINGLE_REPO_PASTE) {
        urlParamMap["mode"] = "import";
        urlParamMap["paste-mode"] = constants.CreationProfileModes.SINGLE_REPO_PASTE;
        urlParamMap["source-object-id"] = nodeModel.get("id");
      }
      var profileUrlParamList = [ "inherited-id", "inherit-properties", "inherit-content", "inherit-vd" ];
      this.updateUrlParams(nodeModel, urlParamMap, profileUrlParamList);
      var url = RestLinkrels.getLink(nodeModel.profileData.data.get("valueConfig").get("links"), RestLinkrels.D2_CREATION_PROPERTIES);
      url = Url.appendQuery(url, Url.combineQueryString(urlParamMap));
      nodeModel.propertiesSource = {
        url: url,
        body: nodeModel.get("o2-properties") && {
          "extracted-o2-properties": nodeModel.get("o2-properties")
        }
      };
    },
    updateUrlParams: function(nodeModel, urlParamMap, profileUrlParams) {
      _.each(profileUrlParams, function(paramName) {
        if (nodeModel.profileData.has(paramName) && nodeModel.profileData.get(paramName)) {
          urlParamMap[paramName] = nodeModel.profileData.get(paramName);
        }
      });
    },
    showCancelAlertForImport: function(message, title, yesButtonLabel, showAlways) {
      if (showAlways === true || this.collection && this.collection.length > 0 || this.fullCollection && this.fullCollection.length > 0) {
        return showConfirmationAlert(title, message, yesButtonLabel);
      } else {
        return $.Deferred().resolve().promise();
      }
    },
    showConfirmationAlert: showConfirmationAlert,
    showErrorAlert: showErrorAlert,
    finishCreateOperation: function(nodeModels, linkRel, async) {
      var dfd = $.Deferred(), promises = [], ayncOp = async !== undefined ? async : true;
      _.each(nodeModels, function(node) {
        var tokenId = node._tokenId, opUrl = RestLinkrels.getLink(node._links || node.get("links"), linkRel);
        delete node._tokenId;
        delete node.propertiesSource;
        if (tokenId && opUrl) {
          var p = $.Deferred();
          promises.push(p);
          $.ajax(node.connector.extendAjaxOptions({
            url: opUrl,
            type: "POST",
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            data: JSON.stringify({
              "token-id": tokenId
            }),
            async: ayncOp,
            success: function(response) {
              p.resolve(response);
            },
            error: function(xhr) {
              p.reject(xhr);
            }
          }));
        }
      });
      $.whenAll.apply($, promises).always(function() {
        dfd.resolve();
      });
      return dfd.promise();
    },
    extractO2Properties: function(nodeModel) {
      var me = this, deferred = $.Deferred(), valueConfig = nodeModel.profileData && nodeModel.profileData.data && nodeModel.profileData.data.get("valueConfig");
      if (valueConfig && valueConfig.get("o2_config")) {
        var url = RestLinkrels.getLink(valueConfig.get("links"), RestLinkrels.D2_EXTRACT_O2_PROPERTIES_URLS), urlParams = {
          inline: true,
          format: nodeModel.get("aContentType"),
          "object-type": valueConfig.get("r_object_type"),
          "o2-config-name": valueConfig.get("o2_config"),
          "content-size": nodeModel.contentFile.size
        };
        if (nodeModel.profileData.get("link-id")) {
          urlParams["link-id"] = nodeModel.profileData.get("link-id");
        }
        url = Url.appendQuery(url, Url.combineQueryString(urlParams));
        var headers = {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        };
        headers[constants.Headers.TIME_ZONE] = formatUtils.getBrowserTimeZone();
        $.ajax(nodeModel.connector.extendAjaxOptions({
          url: url,
          headers: headers,
          type: "GET"
        })).done(function(resp) {
          if (resp && _.isArray(resp.entries)) {
            var o2Urls = _.map(resp.entries, function(entry) {
              return entry.content && entry.content.url;
            });
            if (o2Urls && o2Urls.length > 0) {
              var promise;
              if (nodeModel.contentFile.pluginMode === constants.BrowserPluginMode.WSCTF) {
                promise = me.uploadFileUsingCTF(nodeModel.get("id"), nodeModel.contentFile, o2Urls);
              } else {
                promise = me.uploadFile(nodeModel.connector, nodeModel.contentFile, o2Urls);
              }
              promise.progress(deferred.notify).done(function(o2Response) {
                if (o2Response) {
                  nodeModel.set({
                    "o2-ticket-id": o2Response["ticket_id"],
                    "o2-properties": o2Response["extracted-o2-properties"]
                  }, {
                    silent: true
                  });
                }
                deferred.resolve(nodeModel);
              }).fail(function() {
                deferred.reject(nodeModel);
              });
            } else {
              deferred.reject(nodeModel);
            }
          }
        }).fail(function() {
          deferred.reject(nodeModel);
        });
      } else {
        deferred.reject(nodeModel);
      }
      return deferred.promise();
    },
    mapProfileModelToProfileData: function(profileModel, profileData) {
      var profileDataMap = {
        "profile-id": profileModel.get("id"),
        "link-id": profileModel.get("link-id"),
        "inherited-id": profileModel.get("inherited-id"),
        "inherit-content": profileModel.get("inherit_content"),
        "inherit-properties": profileModel.get("inherit_properties"),
        "inherit-vd": profileModel.get("inherit_vd_structure"),
        "profile-value-config-id": profileModel.get("valueConfig") && profileModel.get("valueConfig").get("id")
      };
      profileData.set(profileDataMap);
      profileData.data = profileModel;
    },
    setProfileDataToNodeModels: function(nodeCollection, profileData) {
      nodeCollection && nodeCollection instanceof Backbone.Collection && nodeCollection.each(function(nodeModel) {
        nodeModel.profileData = profileData;
      });
    },
    hasPropertyPage: function(profileData) {
      return this.hasNonEmptyValueConfigAttribute(profileData, "property_config");
    },
    canEditContent: function(profileData) {
      return !profileData.data.get("skip_edit_content");
    },
    isO2Enabled: function(profileData) {
      return this.hasNonEmptyValueConfigAttribute(profileData, "o2_config");
    },
    hasNonEmptyValueConfigAttribute: function(profileData, attrName) {
      var value = this.getValueConfigAttribute(profileData, attrName);
      return _.isString(value) && !_.isEmpty(value);
    },
    getValueConfigAttribute: function(profileData, attrName) {
      var valueConfig = profileData && profileData.data && profileData.data.get("valueConfig");
      return valueConfig && valueConfig.get(attrName);
    },
    hasO2Properties: function(nodeModel) {
      return nodeModel && nodeModel.get("o2-ticket-id") && nodeModel.get("o2-properties");
    },
    clearO2Properties: function(nodeModel) {
      if (nodeModel) {
        nodeModel.unset("o2-ticket-id", {
          silent: true
        });
        nodeModel.unset("o2-properties", {
          silent: true
        });
      }
    },
    getLinkDocumentRelations: function(nodeModel) {
      var dfd = $.Deferred();
      var url = RestLinkrels.getLink(nodeModel.get("links"), RestLinkrels.D2_LINKED_DOCUMENT_CONFIG);
      $.ajax(nodeModel.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    createLinkDocumentAsSilent: function(parentNodeModel) {
      var dfd = $.Deferred(), promises = [], me = this;
      if (parentNodeModel && parentNodeModel.silentLinkDocuments && parentNodeModel.silentLinkDocuments.length > 0) {
        if (parentNodeModel.qualifiedAsEmail) {
          var attachments = parentNodeModel.childrenCollection.filter(function(attachmentModel) {
            return attachmentModel.isCreationSupported;
          });
          if (attachments && attachments.length) {
            var linkConfig = parentNodeModel.silentLinkDocuments.at(0);
            _.each(attachments, function(attachment) {
              promises.push(me.createSilentLinkedNode(parentNodeModel, linkConfig, attachment));
            });
          } else {
            promises.push($.Deferred().resolve().promise());
          }
        } else {
          parentNodeModel.silentLinkDocuments.each(function(linkConfig) {
            promises.push(me.createSilentLinkedNode(parentNodeModel, linkConfig));
          });
        }
      }
      $.whenAll.apply($, promises).done(function(nodeList) {
        dfd.resolve(nodeList);
      }).fail(function(xhrs) {
        dfd.reject(xhrs);
      });
      return dfd.promise();
    },
    createSilentLinkedNode: function(parentNode, linkConfig, attachmentNode) {
      var dfd = $.Deferred();
      var linkId = parentNode.profileData.get("link-id");
      var url = RestLinkrels.getLink(linkConfig.get("links"), RestLinkrels.D2_SILENT_LINKED_DOCUMENT_CREATION);
      if (linkId) {
        url = Url.appendQuery(url, Url.combineQueryString({
          "link-id": linkId
        }));
      }
      if (attachmentNode) {
        url = Url.appendQuery(url, Url.combineQueryString({
          "attachment-name": attachmentNode.contentFile.name
        }));
      }
      $.ajax(parentNode.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          var tokenId = response["token-id"];
          var nodeModel = attachmentNode || new NodeModel(undefined, {
            context: parentNode.context,
            connector: parentNode.connector
          });
          var nodeProp = nodeConverter.convertNode(response);
          nodeModel.set(nodeProp);
          nodeModel.linkedDocument = true;
          nodeModel._tokenId = tokenId;
          nodeModel._links = nodeModel.get("links");
          dfd.resolve(nodeModel);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    createLinkDocumentRelations: function(parentNodeModel, childNodeModel, linkDocConfig) {
      var dfd = $.Deferred();
      if (linkDocConfig.get("link_type") === constants.DocumentLinkType.RELATION) {
        this.createLinkAsRelations(parentNodeModel, childNodeModel, linkDocConfig).done(function(data) {
          dfd.resolve(data);
        }).fail(function(error) {
          dfd.reject(error);
        });
      } else if (linkDocConfig.get("link_type") === constants.DocumentLinkType.VD) {
        this.createLinkAsVD(parentNodeModel, childNodeModel).done(function(data) {
          dfd.resolve(data);
        }).fail(function(error) {
          dfd.reject(error);
        });
      } else if (linkDocConfig.get("link_type") === constants.DocumentLinkType.VD_RELATION) {
        this.createLinkAsVDRelation(parentNodeModel, childNodeModel, linkDocConfig).done(function(data) {
          dfd.resolve(data);
        }).fail(function(error) {
          dfd.reject(error);
        });
      }
      return dfd.promise();
    },
    createLinkAsVD: function(parentNodeModel, childNodeModel) {
      var request = {
        "chronicle-id": childNodeModel.get("id")
      };
      var dfd = $.Deferred();
      var url = RestLinkrels.getLink(parentNodeModel.get("links"), RestLinkrels.D2_VIRTUAL_DOC_CONVERSION);
      if (parentNodeModel.get("r_is_virtual_doc") === 1) {
        url = RestLinkrels.getLink(parentNodeModel.get("links"), RestLinkrels.ADD_VIRTUAL_DOCUMENT_NODES);
        request = {
          "virtual-document-nodes": [ request ]
        };
      }
      $.ajax(parentNodeModel.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(request),
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    createLinkAsRelations: function(parentNodeModel, childNodeModel, linkDocConfig) {
      var request = {
        properties: {
          relation_name: linkDocConfig.get("relation_name"),
          child_id: childNodeModel.get("id")
        }
      };
      var dfd = $.Deferred();
      var url = RestLinkrels.getLink(parentNodeModel.get("links"), RestLinkrels.D2_RELATIONS);
      $.ajax(parentNodeModel.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(request),
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(xhr) {
          dfd.reject(xhr);
        }
      }));
      return dfd.promise();
    },
    createLinkAsVDRelation: function(parentNodeModel, childNodeModel, linkDocConfig) {
      var self = this;
      var dfd = $.Deferred();
      self.createLinkAsVD(parentNodeModel, childNodeModel).done(function(vdLinkData) {
        self.createLinkAsRelations(parentNodeModel, childNodeModel, linkDocConfig).done(function(relationLinkData) {
          var response = {
            vdLinkData: vdLinkData,
            relationLinkData: relationLinkData
          };
          dfd.resolve(response);
        }).fail(function(error) {
          dfd.reject(error);
        });
      }).fail(function(error) {
        dfd.reject(error);
      });
      return dfd.promise();
    },
    getLinkDocumentConfigurations: function(status, options) {
      if (options && options.linkedDocumentExist) {
        status.linkedDocumentExist = true;
        return $.Deferred().resolve().promise();
      }
      var connector = status.context.getObject(ConnectorFactory), dfd = $.Deferred(), links = RestResources.getCurrentRepository().get("links"), url = Url.combine(RestLinkrels.getLink(links, RestLinkrels.D2_CONFIGURATIONS), "linked-document-configurations");
      $.ajax(connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          status.linkedDocumentExist = !!(response && response.entries && response.entries.length > 0);
          dfd.resolve();
        },
        error: function(request, textStatus, error) {
          dfd.reject(error);
        }
      }));
      return dfd.promise();
    },
    getLinkDocumentRelationsConfig: function(data) {
      var groupLinkDocumentRelations = new Backbone.Collection();
      var silentLinkDocuments = new Backbone.Collection();
      groupLinkDocumentRelations.comparator = "position";
      _.each(data.entries, function(item) {
        var entry = _.extend({
          id: item.id
        }, _.pick(item.content, "links"));
        entry = _.extend(entry, item.content.properties);
        if (entry.silent) {
          var silentLinkDocument = new Backbone.Model(entry);
          silentLinkDocuments.add(silentLinkDocument);
        } else {
          if (entry["link_type"] === constants.DocumentLinkType.VD) {
            entry["relation_name"] = lang.virtualDocument;
          }
          var relation = new Backbone.Model(entry);
          var record = groupLinkDocumentRelations.findWhere({
            relation_name: relation.get("relation_name"),
            required: relation.get("required")
          });
          if (record) {
            record.get("relation_items").add(relation);
          } else {
            var relationItems = new Backbone.Collection();
            relationItems.add(relation);
            var position = 0;
            if (!relation.get("required")) {
              position = 1;
            }
            var linkDocumentRelation = new Backbone.Model({
              relation_name: relation.get("relation_name"),
              required: relation.get("required"),
              relation_items: relationItems,
              document_linked: false,
              position: position
            });
            groupLinkDocumentRelations.add(linkDocumentRelation);
          }
        }
      });
      return {
        groupLinkDocumentRelations: groupLinkDocumentRelations,
        silentLinkDocuments: silentLinkDocuments
      };
    },
    getCollectionForAttachment: function(collection) {
      var attachments = [];
      if (collection && collection.length > 0) {
        collection.each(function(item) {
          if (item.childrenCollection && item.childrenCollection.length > 0) {
            var attachmentCollection = item.childrenCollection, parentInfoIncluded = false;
            attachmentCollection.each(function(attachemtItem) {
              if (attachemtItem.isCreationSupported) {
                attachemtItem.parentItem = item;
                if (!parentInfoIncluded) {
                  attachemtItem.showParent = true;
                  parentInfoIncluded = true;
                }
                attachments.push(attachemtItem);
              }
            });
          }
        });
      }
      return new Backbone.Collection(attachments);
    },
    isLinkDocumentApplicable: function(collection) {
      if (collection && collection.length > 0) {
        return collection.any(function(model) {
          return model.linkDocConfig && model.linkDocConfig.length > 0 && model.qualifiedAsEmail !== true;
        });
      }
      return false;
    },
    isEmailFlowApplicable: function(collection) {
      if (collection && collection.length) {
        return collection.any(function(model) {
          return model.childrenCollection && model.childrenCollection.length > 0 && model.linkDocConfig && model.linkDocConfig.length > 0;
        });
      }
      return false;
    },
    getAcceptableEmailNodes: function(collection) {
      if (collection && collection.length) {
        return collection.filter(function(model) {
          return model.childrenCollection && model.childrenCollection.length > 0 && model.linkDocConfig && model.linkDocConfig.length > 0;
        });
      }
      return [];
    },
    getNodesExceptEmails: function(collection) {
      if (collection && collection.length) {
        return collection.filter(function(model) {
          return !model.qualifiedAsEmail;
        });
      }
      return [];
    },
    extractAttachmentsIfEmail: function(nodeModel) {
      var dfd = $.Deferred(), me = this;
      if (nodeModel) {
        var url = RestLinkrels.getLink(nodeModel.get("links"), RestLinkrels.D2_EXTRACT_EMAIL_ATTACHMENTS), urlParams = {
          inline: true
        };
        if (url) {
          url = Url.appendQuery(url, Url.combineQueryString(urlParams));
          nodeModel.qualifiedAsEmail = true;
          $.ajax(nodeModel.connector.extendAjaxOptions({
            url: url,
            type: "GET",
            headers: {
              "Content-Type": constants.MediaTypes.DCTM_JSON
            },
            success: function(resp) {
              var disputedAttachment = null;
              if (resp) {
                nodeModel.childrenCollection = new Backbone.Collection([]);
                _.each(resp.entries, function(entry) {
                  if (entry.content) {
                    var file = {
                      name: entry.content.file_name,
                      type: ""
                    };
                    var attachmentModel = new NodeModel({
                      name: file.name,
                      mime_type: file.type,
                      a_content_type: entry.content.format
                    }, {
                      connector: nodeModel.connector,
                      context: nodeModel.context
                    });
                    attachmentModel.contentFile = file;
                    attachmentModel.isCreationSupported = entry.content.is_creation_supported;
                    attachmentModel.relationName = entry.content.relation_name;
                    attachmentModel.isEmailAttachment = true;
                    nodeModel.childrenCollection.add(attachmentModel);
                  }
                });
                disputedAttachment = nodeModel.childrenCollection.find(function(attachmentModel) {
                  return !attachmentModel.isCreationSupported;
                });
              }
              if (disputedAttachment) {
                me.createLinkAsRelations(nodeModel, nodeModel, new Backbone.Model({
                  relation_name: disputedAttachment.relationName
                })).always(function() {
                  dfd.resolve(nodeModel);
                });
              } else {
                dfd.resolve(nodeModel);
              }
            },
            error: function(xhr) {
              dfd.reject(xhr);
            }
          }));
        } else {
          dfd.resolve(nodeModel);
        }
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    getSourceContentNode: function(commandStatus) {
      var node;
      if (commandStatus) {
        node = CommandHelper.getJustOneNode(commandStatus);
        if (!node && commandStatus.container && !nodeConverter.isNonDCTMNode(commandStatus.container)) {
          node = commandStatus.container;
        }
      }
      return node;
    },
    getLandingPageInheritedNode: function(commandStatus) {
      var node;
      if (commandStatus && commandStatus.landingPageId) {
        node = new NodeModel({
          id: commandStatus.landingPageId,
          container: true
        }, {
          context: commandStatus.context,
          connector: commandStatus.context.getObject(ConnectorFactory)
        });
      }
      return node;
    },
    fetchPresetProfile: function(mode, commandStatus, commandOptions) {
      var deferred = $.Deferred();
      if (commandStatus && commandStatus.data && !commandStatus.presetModel) {
        var connector = commandStatus.context && commandStatus.context.getObject(ConnectorFactory), presetModel = PresetValueConfigModel.create(commandStatus.data[constants.PRESET_PROFILE.KEY_PRESET_NAME], commandStatus.data[constants.PRESET_PROFILE.KEY_PRESET_VALUE_CONFIG_ID], {
          mode: mode || "",
          connector: connector,
          isOperatingModePreset: true,
          inheritableSourceNode: this.getSourceContentNode(commandStatus) || this.getLandingPageInheritedNode(commandStatus)
        });
        if (presetModel) {
          var originatingView = commandStatus.originatingView;
          originatingView && originatingView.blockActions();
          presetModel.fetch().always(function() {
            originatingView && originatingView.unblockActions();
          }).done(function() {
            deferred.resolve(_.extend(commandStatus, {
              presetModel: presetModel
            }), commandOptions);
          }).fail(function(xhr) {
            deferred.reject(xhr);
          });
        } else {
          deferred.resolve(commandStatus, commandOptions);
        }
      } else {
        deferred.resolve(commandStatus, commandOptions);
      }
      return deferred.promise();
    },
    getInvalidExtensionMessage: function(disAllowedFiles) {
      if (disAllowedFiles === null || disAllowedFiles.length === 0) {
        return null;
      }
      if (disAllowedFiles instanceof File) {
        return _.str.sformat(lang.invalidExtension, disAllowedFiles.name);
      } else {
        var fileStr;
        if (disAllowedFiles[0] instanceof File) {
          fileStr = disAllowedFiles[0].name;
        } else {
          fileStr = disAllowedFiles;
        }
        for (var i = 1; i < disAllowedFiles.length; i++) {
          fileStr = fileStr + ", ";
          if (disAllowedFiles[i] instanceof File) {
            fileStr = fileStr + disAllowedFiles[i].name;
          } else {
            fileStr = fileStr + disAllowedFiles;
          }
        }
        if (disAllowedFiles.length > 1) {
          return _.str.sformat(lang.invalidExtensions, fileStr);
        } else {
          return _.str.sformat(lang.invalidExtension, fileStr);
        }
      }
    },
    showInvalidEndingsMesssage: function(disAllowedFiles) {
      var invalidExtension = this.getInvalidExtensionMessage(disAllowedFiles);
      Alert.showInfo(invalidExtension);
    },
    isEndingAllowed: function(filename) {
      var i, options = RestResources.getD2Options(), allowedEndings = options.file_ending_configuration;
      if (allowedEndings) {
        var fileNameLC = filename.toLowerCase();
        var allowNoExtension = allowedEndings.allowFilesWithNoExtension;
        var extIndex = fileNameLC.indexOf(".");
        if (extIndex === -1 || extIndex === fileNameLC.length) {
          return !!allowNoExtension;
        }
        var isWhiteList = allowedEndings.is_white_list;
        var allowedEndingsList = allowedEndings.file_endings;
        if (isWhiteList) {
          for (i = 0; i < allowedEndingsList.length; i++) {
            if (fileNameLC.endsWith(allowedEndingsList[i])) {
              return true;
            }
          }
          return false;
        } else {
          for (i = 0; i < allowedEndingsList.length; i++) {
            if (fileNameLC.endsWith(allowedEndingsList[i])) {
              return false;
            }
          }
          return true;
        }
      }
      return true;
    },
    addDisallowedFilesToModels: function(dialog, disAllowedFiles, folderUploadModels) {
      if (folderUploadModels) {
        _.each(disAllowedFiles, _.bind(function(file) {
          if (file.type?.length > 0) {
            file.mime_type = file.type;
          }
          folderUploadModels.add({
            name: file.name,
            total: 1,
            type: file.type,
            state: "rejected",
            errorMessage: file.message
          }, {
            node: new Backbone.Model({
              mime_type: file.mime_type,
              a_content_type: file.name && file.name.lastIndexOf(".") != -1 ? file.name.substring(file.name.lastIndexOf(".") + 1) : ""
            })
          });
        }, dialog));
      }
    },
    filterFileArrayMsg: function(fileList, showMessage, allowedFiles) {
      var disAllowedFiles = [];
      var disAllowedFileNames = [];
      var filteredFileList = [];
      var self = this;
      var fileDetails = this.filterFiles(fileList);
      filteredFileList = _.filter(fileDetails.validFiles, function(file) {
        return !file.error;
      });
      disAllowedFiles = _.filter(fileDetails.validFiles, function(file) {
        return file.error;
      });
      disAllowedFileNames = _.map(fileDetails.validFiles, function(file) {
        if (file.error) {
          return file.name;
        }
      });
      if (showMessage && disAllowedFiles.length > 0) {
        self.showInvalidEndingsMesssage(disAllowedFileNames);
      }
      if (allowedFiles) {
        return filteredFileList;
      } else {
        return disAllowedFiles;
      }
    },
    pollAsyncVNodeStatus: function(nodeModel) {
      var url = nodeModel.asyncURL;
      var dfd = $.Deferred();
      $.ajax(nodeModel.connector.extendAjaxOptions({
        url: url,
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          dfd.resolve(response);
        },
        error: function(request, textStatus, error) {
          dfd.reject(request, textStatus, error);
        }
      }));
      return dfd.promise();
    },
    filterFiles: function(fileItem) {
      var fileLimit = 0, exceededSize = true, isAllowedEnding = true, validFiles = [], self = this;
      fileLimit = RestResources.getD2Options().max_upload_file_size;
      var sizeInMB = fileLimit / (1024 * 1024);
      if (fileItem) {
        if (fileItem instanceof FileList || _.isArray(fileItem)) {
          _.each(fileItem, function(item) {
            var file = item.file ? item.file : item;
            exceededSize = fileLimit && fileLimit !== 0 ? (item.file ? item.file.size : item.size) <= fileLimit : true;
            isAllowedEnding = self.isEndingAllowed(file.name);
            if (!exceededSize || !isAllowedEnding) {
              file.error = true;
              file.message = _.str.sformat(!isAllowedEnding ? lang.invalidFormat : lang.invalidFileSizeErrorMessage, sizeInMB);
              file.isAllowedEnding = isAllowedEnding;
            }
            validFiles.push(file);
          });
        } else {
          var file = fileItem.file ? fileItem.file : fileItem;
          exceededSize = fileLimit && fileLimit !== 0 ? fileItem.size <= fileLimit : true;
          isAllowedEnding = self.isEndingAllowed(file.name);
          if (!exceededSize || !isAllowedEnding) {
            file.error = true;
            file.message = _.str.sformat(!isAllowedEnding ? lang.invalidFormat : lang.invalidFileSizeErrorMessage, sizeInMB);
          }
          validFiles.push(file);
        }
      }
      var errorObject = _.find(validFiles, function(item) {
        return item.error;
      });
      return {
        status: !errorObject,
        message: errorObject ? errorObject.message : "",
        validFiles: validFiles
      };
    },
    refreshSelection: function(status, options) {
      var deferred = $.Deferred();
      if (status.collection || status.originatingView && status.originatingView.collection) {
        var selectedNodes = CommandHelper.getAtLeastOneNode(status), collection = status.collection || status.originatingView.collection;
        CommandHelper.refreshNodes(selectedNodes, {
          connector: status.context.getObject(ConnectorFactory),
          widgetType: status.collection.widgetType,
          widgetName: status.collection && status.collection.options && status.collection.options.widgetName,
          collection: collection,
          selectedNodes: selectedNodes,
          mergeOldAttributes: true
        }).done(function(data) {
          if (data && options) {
            options.selectedNodesRefreshed = data.nodesRefreshed;
          }
          deferred.resolve();
        }).fail(deferred.reject);
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    _getImportRenditionUrl: function(options) {
      var dfd = $.Deferred(), me = this, url = RestLinkrels.getLink(options?.nodeModel.get("links"), RestLinkrels.D2_IMPORT_RENDITIONS_URLS);
      if (!url) {
        url = CommandHelper.getOriginalActionLink(options?.nodeModel, options?.signature);
      }
      url = Url.appendQuery(url, Url.combineQueryString({
        format: options.fileContent.format,
        inline: true
      }));
      $.ajax(options?.nodeModel.connector.extendAjaxOptions({
        url: url,
        type: "GET",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          var setFileUrl = response.entries[0].content.url;
          me.uploadFile(options.nodeModel.connector, options.fileContent.file, setFileUrl, options.extraFormData).done(() => {
            dfd.resolve();
          }).fail(() => {
            dfd.reject();
          });
        },
        error: function() {
          dfd.reject();
        }
      }));
      return dfd.promise();
    }
  };
});