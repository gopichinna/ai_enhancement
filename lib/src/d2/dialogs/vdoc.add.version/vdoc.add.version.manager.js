/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "csui/utils/commandhelper", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/utils/vdoc.utils", "dctmw/utils/utils", "csui/models/fileuploads", "nuc/models/node/node.model", "nuc/models/nodes", "d2/controls/globalmessage/globalmessage", "nuc/utils/url", "d2/ctf/ctfBridge", "d2/dialogs/user.settings/user.settings.utils", "d2/utils/constants", "d2/dialogs/add.version/add.version.manager", "csui/dialogs/modal.alert/modal.alert", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, CommandHelper, RestLinkrels, RestResources, ModalAlert, vdocUtils, utils, UploadFileCollection, NodeModel, NodeCollection, GlobalMessage, Url, ctfBridge, userSettingsUtils, constants, AddVersionManager, AlertDialog, lang) {
  "use strict";
  return AddVersionManager.extend({
    execute: function() {
      var me = this, arg = arguments, status = this.status;
      this.ctfEnabled = ctfBridge.isCtfEnabled();
      var checkinOnlyRoot = function() {
        status.data.isRootVDCheckin = true;
        me.isRootVDCheckin = true;
        return AddVersionManager.prototype.execute.apply(me, arg);
      }, handleVdCheckin = function(showOptionsDialog) {
        if (me.ftNode && me.ftNode.origNode.isVirtualDoc() && vdocUtils.hasVDChildren(me.ftNode.origNode) || me.isExpandedView && me.rootNode.isVirtualDoc() && vdocUtils.hasVDChildren(me.rootNode)) {
          me.ftNode && !me.ftNode.isExpanded() && me.ftNode.setExpanded(true);
          me.checkinRootAndDescendants = true;
          if (showOptionsDialog) {
            return me.ShowCheckinOptionDlg(status, checkinOnlyRoot);
          } else {
            return me.checkinWithDescendants(status);
          }
        } else {
          return checkinOnlyRoot();
        }
      };
      if (!status.originatingView.explorerView && status.originatingView.options.isExpandedView) {
        this.isExpandedView = true;
        this.rootNode = CommandHelper.getJustOneNode(status);
      } else {
        this.isExpandedView = false;
        this.ftNode = status.originatingView.editVDView?.vdocStructure.treeView.tree.focusNode || status.originatingView.explorerView?.vdStructureView.treeView.tree.focusNode || this._getFtNode(status);
        if (!this.ftNode.origNode) {
          this.ftNode.origNode = this.ftNode.data.origNode;
        }
      }
      if (status.data && status.data[constants.VDAddVesionOptions.ROOT] === "true" && status.data[constants.VDAddVesionOptions.ROOT_AND_DESCENDANTS] === "true") {
        return handleVdCheckin(true);
      } else if (status.data && (status.data[constants.VDAddVesionOptions.ROOT] === "false" || status.data[constants.VDAddVesionOptions.ROOT] === undefined) && status.data[constants.VDAddVesionOptions.ROOT_AND_DESCENDANTS] === "true") {
        return handleVdCheckin(false);
      } else {
        return checkinOnlyRoot();
      }
    },
    _getFtNode: function(status) {
      var currentActiveNodeKey = status.originatingView.explorerView.vdStructureView.treeView.tree._currActiveNodeKey;
      return status.originatingView.explorerView.vdStructureView.treeView.tree.getNodeByKey(currentActiveNodeKey);
    },
    ShowCheckinOptionDlg: function(status, checkinRootCallback) {
      this.status = status;
      this.checkinRootOnly = checkinRootCallback;
      var dfd = $.Deferred(), buttonOptions = {
        showYes: true,
        labelYes: lang.CommandVDocAddVesionDialogLabelYes,
        showNo: false,
        showCancel: true,
        context: status.context
      }, viewOptions = {
        name: CommandHelper.getJustOneNode(status).get("name"),
        context: status.context
      }, me = this;
      require([ "d2/dialogs/vd.add.version.options/vd.add.version.options.dialog" ], function(AddVersionOptionsDialogView) {
        var contentView = new AddVersionOptionsDialogView(viewOptions);
        ModalAlert.confirmQuestion(function(result) {
          if (result) {
            if (contentView.options && contentView.options["add-version-type"] && contentView.options["add-version-type"] === constants.VDAddVesionOptions.ROOT) {
              return me.checkinRootOnly();
            } else if (contentView.options && contentView.options["add-version-type"] && contentView.options["add-version-type"] === constants.VDAddVesionOptions.ROOT_AND_DESCENDANTS) {
              me.checkinRootAndDescendants = true;
              return me.checkinWithDescendants(me.status);
            }
          } else {
            return dfd.reject({
              cancelFlag: true
            }).promise();
          }
        }, "", lang.CommandVDocAddVesionDialogTitle, {
          buttons: buttonOptions,
          contentView: contentView,
          className: "d2-vd-modal-dialog-add-version-form"
        });
      });
    },
    checkinWithDescendants: function(status) {
      var me = this, descendantsChildren = [];
      if (this.isExpandedView) {
        descendantsChildren = status.collection.getChildrenOf(CommandHelper.getJustOneNode(status), false);
        descendantsChildren.splice(0, 0, this.rootNode);
        return me.showAddVersionDialog(status, descendantsChildren);
      } else {
        var ftNode = this.ftNode;
        descendantsChildren.push(ftNode);
        me._recursiveExpandSubtree(ftNode, descendantsChildren).done(function() {
          return me.showAddVersionDialog(status, descendantsChildren);
        });
      }
    },
    _recursiveExpandSubtree: function(ftNode, descendantsChildren) {
      var dfd = $.Deferred(), me = this, childrenExpander = function() {
        var children = ftNode.getChildren(), promises = [];
        if (_.isArray(children)) {
          for (var c = 0; c < children.length; c++) {
            descendantsChildren.push(children[c]);
            promises.push(me._recursiveExpandSubtree(children[c], descendantsChildren));
          }
        }
        $.whenAll.apply($, promises).done(dfd.resolve).fail(dfd.reject);
      };
      if (ftNode.hasChildren() !== false) {
        if (ftNode.isExpanded() !== true) {
          ftNode.setExpanded(true).done(function() {
            childrenExpander();
          });
        } else {
          childrenExpander();
        }
      } else {
        dfd.resolve([]);
      }
      return dfd.promise();
    },
    getCheckinConfigLink: function(node) {
      return RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_CHECKIN_CONFIG);
    },
    showAddVersionDialog: function(status, children) {
      this.status = status;
      var me = this, deferred = $.Deferred();
      this.fetchCheckInConfigs(status.collection.connector, children).done(function(successList) {
        var checkinConfig = _.first(successList).output["config-properties"];
        var isSilentCheckinConfiguration = checkinConfig["silent_checkin"] && !checkinConfig["can_log_entry"] && !checkinConfig["property_page"];
        var checkinFiles = function(configData) {
          if (me.ctfEnabled) {
            me._checkinUsingCtf(function() {
              me._openWizard(configData, isSilentCheckinConfiguration).done(deferred.resolve).fail(deferred.reject);
            }, function(err) {
              deferred.reject(err);
            }, configData);
          } else {
            me._openWizard(configData, isSilentCheckinConfiguration).done(deferred.resolve).fail(deferred.reject);
          }
        };
        var fileMandatoryFlag = _.any(successList, function(eachNode) {
          return eachNode.output["config-properties"].checkin_from_file_mandatory;
        });
        _.each(successList, function(configNode) {
          configNode.node = me.isExpandedView ? status.originatingView.options.vdTreeCollection.find({
            id: configNode.id
          }) : status.collection.find({
            id: configNode.id
          });
        });
        if (!fileMandatoryFlag && isSilentCheckinConfiguration) {
          me._startGlobalMessage(successList);
          me.checkInSilently(status).done(deferred.resolve).fail(deferred.reject);
        } else if (!_.first(successList).output["checkin-version-options"]) {
          AlertDialog.showError(lang.AddVersionCheckinNoPermissionFailMsg).always(function() {
            deferred.resolve();
          });
        } else if (_.first(successList).output["config-properties"].property_page) {
          me.fetchPropertyPages(successList).done(function(configData) {
            me.resolveCheckinLinkForNodes(configData).done(function(checkinUrlData) {
              _.each(configData, function(nodeConfig) {
                var checkinUrl = _.findWhere(checkinUrlData, {
                  id: nodeConfig.node.get("id")
                }).url;
                _.extend(nodeConfig, {
                  checkinurl: checkinUrl,
                  checkin_from_file_mandatory: nodeConfig.output["config-properties"].checkin_from_file_mandatory,
                  shareInfo: {},
                  fileInfo: {},
                  propertyPage: nodeConfig.page && nodeConfig.page["page-content"],
                  externalEsign: nodeConfig.page && nodeConfig.page["external-esign-off"],
                  showExpandESign: true,
                  setEsignRequired: true,
                  eSignMessage: nodeConfig.page && nodeConfig.page["external-esign-off"] && nodeConfig.page["external-esign-off"].url ? lang.AddVersionExternalEsignMessage : "",
                  externalAuditURL: RestLinkrels.getLink(nodeConfig.page && nodeConfig.page["links"], RestLinkrels.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS),
                  ctfEnabled: me.ctfEnabled,
                  isMultipleCheckin: true
                });
                nodeConfig.config = {
                  properties: _.extend({}, nodeConfig.output["config-properties"])
                };
                _.extend(nodeConfig.config, nodeConfig.output);
              });
              checkinFiles(configData);
            });
          });
        } else {
          me.resolveCheckinLinkForNodes(successList).done(function(checkinUrlData) {
            _.each(successList, function(nodeConfig) {
              var checkinUrl = _.findWhere(checkinUrlData, {
                id: nodeConfig.node.get("id")
              }).url;
              _.extend(nodeConfig, {
                checkinurl: checkinUrl,
                checkin_from_file_mandatory: nodeConfig.output["config-properties"].checkin_from_file_mandatory,
                shareInfo: {},
                fileInfo: {},
                propertyPage: nodeConfig.page && nodeConfig.page["page-content"],
                externalEsign: nodeConfig.page && nodeConfig.page["external-esign-off"],
                externalAuditURL: RestLinkrels.getLink(nodeConfig.page && nodeConfig.page["links"], RestLinkrels.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS),
                ctfEnabled: me.ctfEnabled,
                eSignMessage: nodeConfig.page && nodeConfig.page["external-esign-off"] && nodeConfig.page["external-esign-off"].url ? lang.AddVersionExternalEsignMessage : "",
                showExpandESign: true,
                setEsignRequired: true,
                isMultipleCheckin: true
              });
              nodeConfig.config = {
                properties: _.extend({}, nodeConfig.output["config-properties"])
              };
              _.extend(nodeConfig.config, nodeConfig.output);
            });
            checkinFiles(successList);
          });
        }
      });
      return deferred.promise();
    },
    fetchCheckInConfigs: function(connector, children) {
      var deferred = $.Deferred(), me = this, checkoutNodes = [], objectNodeExist = {};
      _.each(children, function(eachNode) {
        var node = me.isExpandedView ? eachNode : eachNode.data && eachNode.data.origNode && eachNode.data.origNode;
        if (node.get("reserved")) {
          if (!objectNodeExist[node.get("id")]) {
            objectNodeExist[node.get("id")] = true;
            checkoutNodes.push({
              id: node.get("id"),
              request: {
                method: "GET",
                uri: me.getCheckinConfigLink(node),
                headers: [ {
                  name: "Content-Type",
                  value: constants.MediaTypes.DCTM_JSON
                } ]
              }
            });
          }
        }
      });
      utils.makeBatchAjaxCall({
        connector: connector,
        operations: checkoutNodes,
        continueOnError: true,
        sequential: true
      }).done(function(successList, errorList) {
        deferred.resolve(successList, errorList);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    fetchPropertyPages: function(configdata) {
      var deferred = $.Deferred(), me = this, payLoadFetchPropertyPage = [];
      this.configdata = configdata;
      _.each(configdata, function(eachNodeConfig) {
        eachNodeConfig.node = me.isExpandedView ? me.status.originatingView.options.vdTreeCollection.find({
          id: eachNodeConfig.id
        }) : me.status.collection.find({
          id: eachNodeConfig.id
        });
        if (eachNodeConfig.output["config-properties"].property_page) {
          var url = RestLinkrels.getLink(eachNodeConfig.output.links, RestLinkrels.PROPERTY_PAGE);
          payLoadFetchPropertyPage.push({
            id: eachNodeConfig.node.get("id"),
            request: {
              method: "GET",
              uri: url,
              headers: [ {
                name: "Content-Type",
                value: constants.MediaTypes.DCTM_D2_V1_JSON
              }, {
                name: "Accept",
                value: constants.MediaTypes.DCTM_D2_V1_JSON
              } ]
            }
          });
        }
      });
      utils.makeBatchAjaxCall({
        connector: me.status.collection.connector,
        operations: payLoadFetchPropertyPage,
        continueOnError: true,
        sequential: true
      }).done(function(successList, errorList) {
        _.each(successList, function(eachData) {
          _.each(me.configdata, function(eachItem) {
            if (eachData.id === eachItem.id) {
              eachItem.page = eachData.output;
            }
          });
        });
        deferred.resolve(me.configdata, errorList);
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    getCheckinLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.command.get("signature"), RestLinkrels.D2_CHECKIN_URL);
    },
    resolveCheckinLinkForNodes: function(successList) {
      var promises = [];
      _.each(successList, nodeConfig => {
        promises.push(this.resolveCheckinLink(nodeConfig.node));
      });
      return $.whenAll.apply($, promises);
    },
    resolveCheckinLink: function(node) {
      let getObjectCheckinUrl = () => {
        let url = this.getCheckinLink(node);
        if (url) {
          return {
            id: node.get("id"),
            url: url
          };
        }
      }, dfd = $.Deferred(), urlData = getObjectCheckinUrl();
      if (urlData) {
        dfd.resolve(urlData);
      } else {
        let interval = setInterval(() => {
          urlData = getObjectCheckinUrl();
          if (urlData) {
            dfd.resolve(urlData);
            clearInterval(interval);
          }
        }, 100);
      }
      return dfd.promise();
    },
    _getSilentCheckinUrl: function(node, status) {
      return CommandHelper.getOriginalActionLink(node, this.command.get("signature"), RestLinkrels.D2_VD_SILENT_CHECKIN, null, status.data);
    },
    checkInSilently: function(status) {
      var deferred = $.Deferred(), me = this, node = CommandHelper.getJustOneNode(status), url = Url.appendQuery(this._getSilentCheckinUrl(node, status), Url.combineQueryString({
        descendants: !!this.checkinRootAndDescendants
      }));
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        success: function(success) {
          var result = success.entries.map(function(successNode) {
            return {
              properties: successNode.content
            };
          });
          me.showSuccessMessage(result, true);
          me.refreshVdocTree().done(function() {
            deferred.resolve();
          }).fail(deferred.reject);
        },
        error: function(xhr) {
          deferred.reject(xhr);
        }
      }));
      return deferred.promise();
    },
    _checkinUsingCtf: function(successCb, failureCb, nodesList) {
      var promises = [], me = this, userpref = RestResources.getCurrentUser().get("preferences"), path = userpref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH], proceedCheckin = function(path) {
        promises = nodesList.map(function(eachNode) {
          var innerDfd = $.Deferred();
          ctfBridge.publishIsDownloaded(eachNode.node.get("id"), path, function(file_path) {
            if (file_path) {
              ctfBridge.publishGetFileSize(eachNode.node.get("id"), path, function(file_size) {
                var filename = file_path.replace(/^.*[\\\/]/, "");
                var file;
                try {
                  file = new File([ "" ], filename);
                  file.path = file_path;
                  file.size = file_size;
                } catch (err) {
                  file = {
                    name: filename,
                    path: file_path,
                    size: file_size
                  };
                }
                eachNode.fileInfo.file = file;
                innerDfd.resolve();
              }, function() {
                innerDfd.resolve();
              });
            } else {
              innerDfd.resolve();
            }
          }, function() {
            innerDfd.resolve();
          });
          return innerDfd.promise();
        });
        $.whenAll.apply($, promises).fail(function() {
          failureCb();
        }).done(function() {
          successCb();
        });
      };
      if (path) {
        proceedCheckin(path);
      } else {
        var title = "", startPath = "";
        ctfBridge.publishSelectFolder(title, "edit", startPath, function success(path) {
          var pref = {};
          pref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH] = path;
          userSettingsUtils.updateUserSettings(pref, {
            connector: me.status.collection.connector
          }).done(function() {
            proceedCheckin(path);
          }).fail(function(err) {
            failureCb(err);
          });
        }, function() {
          failureCb(new Error(lang.SelectResourceFailMessage));
        });
      }
    },
    _openWizard: function(explicitcheckoutNodes, isSilentCheckinConfiguration) {
      var me = this, dfd = $.Deferred();
      require([ "d2/dialogs/vdoc.add.version/vdoc.add.version.dialog" ], function(VdocAddVersionDialog) {
        var dlg = new VdocAddVersionDialog(explicitcheckoutNodes, {
          progressMessage: _.bind(me._startGlobalMessage, me),
          context: me.options.context
        });
        dlg.show(isSilentCheckinConfiguration).done(function(data) {
          me.showSuccessMessage(data);
          me.refreshVdocTree().done(function() {
            dfd.resolve();
          }).fail(dfd.reject);
        }).fail(function(errors) {
          dfd.reject(errors);
        });
      });
      return dfd.promise();
    },
    _startGlobalMessage: function(configData) {
      var me = this, nodes = configData.map(function(eachNodedata) {
        return eachNodedata.node;
      });
      var queueItems = nodes.map(function(item, index) {
        return {
          name: item.get("name"),
          relationId: vdocUtils.getVDRelationId(item),
          state: index === 0 ? "processing" : "pending",
          count: 0,
          total: 1,
          node: item
        };
      });
      me.uploadCollection = new UploadFileCollection(queueItems, {
        connector: me.status.collection.connector
      });
      me.uploadCollection.each(function(item) {
        item.node = item.get("node");
        item.unset("node");
      });
      me.progressPanel = GlobalMessage.showProgressPanel(me.uploadCollection, {
        oneFileSuccess: lang.CheckinSuccessMessage,
        oneFilePending: lang.FilesUploadPending,
        oneFileFailure: lang.CheckinFailureMessage,
        multiFilePending: lang.FilesUploadPending,
        multiFileSuccess: lang.AllFilesCheckinSuccessMessage,
        multiFileOneFailure: lang.MultiFileOneFailureMessage,
        multiFileFailure: lang.MultiFilemultipleFailureMessage,
        originatingView: this.status.originatingView,
        actionType: "VDOC_ADD_VERSION"
      });
    },
    showSuccessMessage: function(results, isSilentCheckin) {
      var me = this;
      var parentNode = this.isExpandedView ? this.rootNode : this.ftNode.origNode;
      me.uploadCollection.each(function(eachNode, index) {
        if (results[index].properties && results[index].properties["r_object_id"] && (isSilentCheckin && results[index].properties["status"] === 200 || !isSilentCheckin)) {
          eachNode.set({
            state: "resolved",
            count: 1,
            errorMessage: ""
          });
        } else {
          eachNode.set({
            state: "rejected",
            count: 1,
            errorMessage: results[index].message
          });
        }
      });
      if (vdocUtils.isRootNode(parentNode)) {
        var newVersionOfParentNode = new NodeModel({
          id: results[0].properties["r_object_id"]
        }, {
          connector: me.status.collection.connector
        });
        newVersionOfParentNode.fetch().done(function() {
          require([ "csui/utils/commands" ], function(commands) {
            var newStatus = {
              nodes: new Backbone.Collection([ newVersionOfParentNode ]),
              context: me.status.context
            };
            commands.get("D2-OpenVDoc").execute(newStatus, {
              replaceLastUrl: true
            });
          });
        });
      }
    },
    refreshVdocTree: function() {
      var dfd = $.Deferred(), parentNode = this.isExpandedView ? this.rootNode : this.ftNode.origNode;
      if (vdocUtils.isRootNode(parentNode)) {
        return dfd.resolve().promise();
      } else {
        this.ftNode.setExpanded(false);
        this.status.collection.refresh({
          vdmNumber: [ vdocUtils.getParentVDMNumber(parentNode), vdocUtils.getVDMNumber(parentNode) ],
          force: false,
          silent: false
        }).done(dfd.resolve).fail(dfd.reject);
        return dfd.promise();
      }
    },
    _showGlobalMessage: function(nodeName) {
      if (this.isRootVDCheckin) {
        var successMessage = _.str.sformat(lang.CheckinSuccessMessage, nodeName);
        GlobalMessage.showMessage("success", successMessage, undefined, {});
      }
    }
  });
});