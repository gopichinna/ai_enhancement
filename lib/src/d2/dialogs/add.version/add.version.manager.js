/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "csui/utils/command.error", "csui/models/command", "nuc/models/node/node.model", "nuc/models/node.children2/node.children2", "csui/models/nodeversions", "csui/models/fileuploads", "csui/dialogs/modal.alert/modal.alert", "d2/dialogs/file.open/file.open.dialog", "d2/controls/globalmessage/globalmessage", "d2/models/virtual.document.children", "d2/server.adaptors/models/widget/favorites/favorites.model", "d2/widgets/checkout/checkout.model", "d2/dialogs/add.version/file.uploader", "d2/dialogs/add.version/add.version.utils", "d2/dialogs/user.settings/user.settings.utils", "dctmw/dialogs/authentication/core.login.dialog", "d2/dialogs/lifecycle/impl/validation.dialog/lifecycle.validation.dialog", "d2/commands/download", "d2/commands/reserve", "d2/commands/unreserve", "dctmw/utils/user.preference.storage", "d2/utils/node.version.utils", "dctmw/utils/utils", "d2/utils/creation.utils", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "d2/utils/constants", "d2/utils/vdoc.utils", "d2/ctf/ctfBridge", "d2/ctf/utils", "d2/utils/widgets.utils", "d2/utils/validator/base.content.upload.validator", "i18n!d2/dialogs/add.version/impl/nls/lang", "i18n!d2/commands/nls/localized.strings" ], function(require, _, $, Backbone, CommandHelper, CommandError, CommandModel, NodeModel, NodeChildren2Collection, NodeVersionCollection, UploadFileCollection, AlertDialog, FileOpenDialog, GlobalMessage, VirtualDocumentChildren, FavoriteCollection, CheckoutCollection, FileUploader, AddVersionUtils, userSettingsUtils, CoreLoginDialog, ValidationDialog, DownloadCommand, ReserveCommand, UnReserveCommand, UserPrefStorage, nodeVersionUtils, utils, CreationUtils, RestLinkrels, RestResources, constants, vdocUtils, ctfBridge, ctfUtils, widgetUtils, BaseContentUploadValidator, lang, commandLang) {
  "use strict";
  function AddVersionManager(status, options, command) {
    options = options || {};
    this.status = status;
    this.options = options;
    this.command = command;
  }
  _.extend(AddVersionManager.prototype, {
    execute: function() {
      var deferred = $.Deferred(), me = this, status = this.status, options = this.options;
      this.suppressProgress = options.suppressProgress === true;
      this.hideSuccessMessage = options.hideSuccessMessage === true;
      this.hideFailureMessage = options.hideFailureMessage === true;
      this.options.isRootVDCheckin = status.data && status.data.isRootVDCheckin;
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      this._removeHighlighting(status);
      var node = CommandHelper.getJustOneNode(status);
      var externalShare = node.get("externalShare");
      if (externalShare && !this.options.checkinFixedFile) {
        this.options.externalShare = externalShare;
      }
      this._addVersion(status).done(deferred.resolve).fail(function(error) {
        if (error && error !== "close") {
          if (options && options.refreshSelectedNode === false) {
            return deferred.reject(error);
          }
          if (utils.isMobile()) {
            var err = new CommandError(error);
            if (err.statusCode === 0) {
              CommandHelper.showOfflineMessage(err);
              return deferred.reject();
            }
          }
          me._refreshSelectedNode().always(function() {
            if (utils.isMobile()) {
              var node = CommandHelper.getJustOneNode(status);
              CommandHelper.showErrorPanel(node, _.str.sformat(commandLang.AddVersionFailGeneralMessage, node.get("name")), error.message);
            }
            deferred.reject();
          });
        } else {
          deferred.reject();
        }
      });
      return deferred.promise();
    },
    _fetchInitialDataForAddVersion: function() {
      var me = this, deferred = $.Deferred(), dlg = new CoreLoginDialog();
      if (me.options && me.options.externalShare && me.options.externalShare.core && me.options.externalShare.shareMode) {
        dlg.login().done(function() {
          var externalShare = me.options.externalShare;
          if (externalShare.shareMode === constants.ShareIntentType.COLLABORATE) {
            me._blockAction();
            me._getShareDetails(me.status).done(function(data) {
              me._unblockAction();
              var file;
              try {
                file = new File([ "" ], constants.OpenTextCore.PATH + data.name);
              } catch (err) {
                file = {
                  name: constants.OpenTextCore.PATH + data.name
                };
              }
              deferred.resolve(file);
            }).fail(function(err) {
              me._unblockAction();
              deferred.reject(err);
            });
          } else if (externalShare.shareMode === constants.ShareIntentType.PUBLISH) {
            deferred.resolve();
          }
        }).fail(function(err) {
          deferred.reject(err);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    _getShareDetails: function(status) {
      var deferred = $.Deferred();
      var node = CommandHelper.getJustOneNode(status);
      var url = CommandHelper.getOriginalActionLink(node, this.command.get("signature"), RestLinkrels.D2_SHARE_TO_CORE);
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        success: function(response) {
          deferred.resolve(response);
        },
        error: function(xhr) {
          deferred.reject(utils.parseAjaxError(xhr));
        }
      }));
      return deferred.promise();
    },
    _removeHighlighting: function(status) {
      if (status.originatingView) {
        var view = status.originatingView;
        var highlighteditem = view.$el.find("tr.csui-new-item");
        if (highlighteditem.length) {
          $(highlighteditem).removeClass("csui-new-item");
        }
        if (status && status.collection) {
          status.collection.each(function(model) {
            delete model.isLocallyCreated;
          });
        }
      }
    },
    _fetchPropertyPageAndOpenAddVersionDialog: function(view, node, checkinconfig, file, ctfEnabled) {
      var deferred = $.Deferred();
      var me = this;
      if (checkinconfig.properties["property_page"]) {
        this.fetchPropertyPage(node, checkinconfig).done(function(page) {
          me._openDlg(view, node, checkinconfig, file, page, ctfEnabled).done(function(data) {
            deferred.resolve(data);
          }).fail(function(error) {
            deferred.reject(error);
          });
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    _cancelCheckout: function() {
      var me = this;
      if (this.reserved) {
        var unreserveCommand = new UnReserveCommand();
        unreserveCommand.execute(me.status, {
          hideSuccessMessage: true
        }).always(function() {
          me.deferred.resolve();
        });
      } else {
        me.deferred.resolve();
      }
    },
    _openDlg: function(view, node, checkinconfig, file, propertyPage, ctfEnabled) {
      var deferred = $.Deferred();
      this.refresh = true;
      var me = this;
      var cancelCheckout = _.bind(this._cancelCheckout, this);
      var setRefresh = _.bind(this._setRefresh, this);
      var checkinurl = this.getCheckinLink(node);
      var imports = utils.isMobile() ? [ "d2mob/dialogs/mobile.add.version/mobile.add.version.dialog" ] : [ "d2/dialogs/add.version/add.version.dialog" ];
      require(imports, function(AddVersionDialog) {
        var options = {
          checkinurl: checkinurl,
          view: view,
          node: node,
          config: checkinconfig,
          fileInfo: {
            file: file
          },
          propertyPage: propertyPage && propertyPage.propertyDialog,
          externalEsign: propertyPage && propertyPage.externalEsign,
          showProcessingStep: me.options.showProcessingStep,
          showExpandESign: true,
          setEsignRequired: true,
          eSignMessage: propertyPage && propertyPage.externalEsign && propertyPage.externalEsign.url ? commandLang.AddVersionExternalEsignMessage : "",
          externalAuditURL: propertyPage && propertyPage.externalAuditURL,
          cancelCheckout: cancelCheckout,
          refresh: setRefresh,
          ctfEnabled: ctfEnabled,
          externalShare: me.options.externalShare,
          checkinFixedFile: me.options.checkinFixedFile,
          checkin_from_file_mandatory: me.checkin_from_file_mandatory,
          commandManager: me,
          shareInfo: {
            useCorePath: !!(me.options.externalShare && me.options.externalShare.core && me.options.externalShare.shareMode === constants.ShareIntentType.COLLABORATE)
          }
        };
        options.context = me.options.context;
        if (utils.isMobile()) {
          options.checkinFixedFile = me.options.isOfflineAddVersion;
        }
        var dlg = new AddVersionDialog(options);
        utils.isMobile() && me._blockAction();
        dlg.show(false).done(function(data) {
          if (dlg.wizard && dlg.wizard.data && dlg.wizard.data.general) {
            data.addVersionInfo = dlg.wizard.data.general;
          }
          deferred.resolve(data);
        }).fail(function(err) {
          deferred.reject(err);
        });
      });
      return deferred.promise();
    },
    _setRefresh: function(flag) {
      this.refresh = flag;
    },
    _refreshPreviousCurrentVersion: function(newNode, oldNodeCurrentVersionState, widgetConfig) {
      var me = this, dfd = $.Deferred();
      function previousCurrentVersionFilter(node) {
        return node.get("i_chronicle_id") === newNode.get("i_chronicle_id") && node.get("id") !== newNode.get("id") && nodeVersionUtils.isCurrentVersion(node, "r_version_label");
      }
      if (nodeVersionUtils.isCurrentVersion(newNode, "r_version_label") && !oldNodeCurrentVersionState && me.status.collection) {
        var previousCurrentNode = me.status.collection.detect(previousCurrentVersionFilter);
        if (!previousCurrentNode && me.status.collection.allModels) {
          previousCurrentNode = _.detect(me.status.collection.allModels, previousCurrentVersionFilter);
        }
        if (previousCurrentNode) {
          CommandHelper.refreshNode(previousCurrentNode, widgetConfig).done(function() {
            dfd.resolve();
          }).fail(function(xhr) {
            dfd.reject(xhr);
          });
        } else {
          dfd.resolve();
        }
      } else {
        dfd.resolve();
      }
      return dfd.promise();
    },
    _refreshNodeList: function(oldid, newid) {
      var dfd = $.Deferred();
      var fromToolBar = this.status.originatingView.$el.find("button.csui-checkbox[aria-checked=true]").length > 0;
      var originatingView = this.status.originatingView, widgetDetails = _.isFunction(originatingView?.getWidgetDetails) ? originatingView.getWidgetDetails() : null, showAllVersions = widgetDetails ? widgetUtils.getWidgetPreference(widgetDetails?.widgetType, widgetDetails?.widgetName)?.get("showAllVersion") : false;
      var oldnode = CommandHelper.getJustOneNode(this.status);
      var me = this;
      var widgetConfig = {};
      var collection = this.status.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
      }
      if (showAllVersions) {
        var oldNodeCurrentVersionState = nodeVersionUtils.isCurrentVersion(oldnode, "r_version_label");
        CommandHelper.refreshNode(oldnode, widgetConfig).done(function() {
          me._isAutoLinked(oldnode, me.status).done(function(autolinked) {
            if (!autolinked) {
              if (newid !== oldid) {
                var model = new NodeModel({
                  id: newid
                }, {
                  connector: me.status.collection.connector
                });
                CommandHelper.refreshNode(model, widgetConfig).done(function() {
                  me._refreshPreviousCurrentVersion(model, oldNodeCurrentVersionState, widgetConfig).always(function() {
                    me._isAutoLinked(model, me.status).done(function(autolinked) {
                      if (!autolinked) {
                        model.isLocallyCreated = true;
                        me.status.collection.add(model, {
                          at: 0
                        });
                      }
                      dfd.resolve();
                    });
                  });
                }).fail(dfd.reject);
                $(".csui-new-item").closest("tbody").scrollTop(0);
              } else {
                dfd.resolve();
              }
            } else {
              me.status.collection.fetch({
                reload: true
              }).done(dfd.resolve);
            }
          });
        }).fail(dfd.reject);
      } else {
        if (!fromToolBar) {
          oldnode.isLocallyCreated = true;
        }
        CommandHelper.refreshNode(oldnode, widgetConfig).done(function() {
          me._isAutoLinked(oldnode, me.status).done(function(autolinked) {
            var isCurrent = nodeVersionUtils.isCurrentVersion(oldnode, "r_version_label");
            if (!autolinked) {
              if (newid !== oldid && !isCurrent) {
                oldnode.set("id", newid);
                setTimeout(function() {
                  CommandHelper.refreshNode(oldnode, widgetConfig).done(function() {
                    me._isAutoLinked(oldnode, me.status).done(function(autolinked) {
                      if (!autolinked) {
                        if (oldnode.thumbnail) {
                          oldnode.thumbnail.imgUrl = undefined;
                          oldnode.set("csuiThumbnailImageUrl", null, {
                            silent: true
                          });
                          oldnode.thumbnail.trigger("loadUrl");
                        }
                      } else {
                        me.status.collection.remove(oldnode);
                        if (me.status.originatingView.removeNodesFromSelection) {
                          me.status.originatingView.removeNodesFromSelection([ oldnode ]);
                        }
                      }
                      dfd.resolve();
                    }).fail(dfd.reject);
                  }).fail(dfd.reject);
                }, 1e3);
              } else {
                dfd.resolve();
              }
            } else {
              if (newid !== oldid && !isCurrent) {
                oldnode.set("id", newid);
                CommandHelper.refreshNode(oldnode, widgetConfig).done(function() {
                  me.status.collection.remove(oldnode);
                  if (me.status.originatingView.removeNodesFromSelection) {
                    me.status.originatingView.removeNodesFromSelection([ oldnode ]);
                  }
                  dfd.resolve();
                }).fail(dfd.reject);
              } else {
                dfd.resolve();
              }
            }
            if (utils.isMobile()) {
              me._unblockAction();
            }
          });
        }).fail(dfd.reject);
      }
      return dfd.promise();
    },
    _isAutoLinked: function(model, status) {
      var deferred = $.Deferred();
      var isAutoLinked = false;
      var parentIds = model.get("i_folder_id");
      if (status.container && !_.contains(parentIds, status.container.get("id"))) {
        isAutoLinked = true;
        var parent = new NodeModel({
          id: parentIds[0]
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        CommandHelper.refreshNode(parent).done(function() {
          model._foldername = parent.get("name");
          if (utils.isMobile()) {
            model.parent = parent;
          }
          deferred.resolve(isAutoLinked);
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        deferred.resolve(isAutoLinked);
      }
      return deferred.promise();
    },
    _showMsg: function(status, node, msg) {
      if (this.hideSuccessMessage === true) {
        return;
      }
      require([ "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view" ], function(NodeCreationSuccessMessageView) {
        GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
          showLink: true,
          node: node,
          context: status.context,
          successMessageFormat: msg,
          linkLabel: commandLang.CreateItemDoneCommandLabel,
          link_command_signature: "Browse"
        });
      });
    },
    _refreshSearchList: function() {
      var dfd = $.Deferred();
      this.status.collection.fetch({
        reload: true,
        keepselection: true
      }).done(dfd.resolve).fail(dfd.reject);
      return dfd.promise();
    },
    _refreshWidget: function() {
      var dfd = $.Deferred();
      var widgetConfig = {};
      var collection = this.status.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
      }
      var oldnode = CommandHelper.getJustOneNode(this.status);
      CommandHelper.refreshNode(oldnode, widgetConfig).done(dfd.resolve);
      return dfd.promise();
    },
    _refreshCollection: function() {
      var dfd = $.Deferred();
      this.status.collection.fetch({
        reload: true
      }).done(dfd.resolve);
      return dfd.promise();
    },
    _refreshVdocTree: function(status, data) {
      var dfd = $.Deferred();
      var coll = status.collection;
      var node = CommandHelper.getJustOneNode(status);
      if (vdocUtils.isRootNode(node)) {
        if (node.get("id") === data.properties.r_object_id) {
          var vdmNumber = vdocUtils.getVDMNumber(node);
          coll.refresh({
            vdmNumber: vdmNumber
          });
          dfd.resolve();
        } else {
          var newNode = new NodeModel({
            id: data.properties.r_object_id
          }, {
            connector: status.context.getObject("connector")
          });
          newNode.fetch().done(function() {
            require([ "csui/utils/commands" ], function(commands) {
              var newStatus = {
                nodes: new Backbone.Collection([ newNode ]),
                context: status.context
              };
              commands.get("D2-OpenVDoc").execute(newStatus, {
                replaceLastUrl: true
              });
            });
            dfd.resolve();
          }).fail(() => {
            dfd.reject();
          });
        }
      } else {
        var vdmParentNumber = vdocUtils.getParentVDMNumber(node);
        coll.refresh({
          vdmNumber: vdmParentNumber
        });
        dfd.resolve();
      }
      return dfd.promise();
    },
    _refreshSelectedNode: function() {
      var oldnode = CommandHelper.getJustOneNode(this.status), widgetConfig = {}, collection = this.status.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
      }
      return CommandHelper.refreshNode(oldnode, widgetConfig);
    },
    _refreshPage: function(data, options) {
      var me = this, deferred = $.Deferred();
      require([ "d2/models/workflow/task.files" ], function(TaskFilesCollection) {
        me._performShareRelatedOperations(data, options).done(function() {
          if (data) {
            var coll = me.status.collection;
            var id = data["properties"]["r_object_id"];
            var node = CommandHelper.getJustOneNode(me.status);
            var oldid = node.get("id");
            if (me.refresh) {
              if (coll) {
                if (coll instanceof NodeChildren2Collection) {
                  me._refreshNodeList(oldid, id).done(() => {
                    deferred.resolve(data);
                  });
                } else if (coll instanceof CheckoutCollection || coll instanceof FavoriteCollection) {
                  me._refreshWidget(oldid, id).done(() => {
                    deferred.resolve(data);
                  });
                } else if (coll instanceof NodeVersionCollection || coll instanceof TaskFilesCollection) {
                  me._refreshCollection().done(() => {
                    deferred.resolve(data);
                  });
                } else if (coll instanceof VirtualDocumentChildren) {
                  me._refreshVdocTree(me.status, data).done(() => {
                    deferred.resolve(data);
                  });
                } else {
                  me._refreshSearchList(oldid, id).done(() => {
                    deferred.resolve(data);
                  });
                }
              } else {
                var oldnode = CommandHelper.getJustOneNode(me.status);
                CommandHelper.refreshNode(oldnode).done(() => {
                  deferred.resolve(data);
                }).fail(() => {
                  deferred.reject();
                });
              }
            }
          }
        }).fail(function(error) {
          deferred.reject(error);
        });
      }, deferred.reject);
      return deferred.promise();
    },
    _performShareRelatedOperations: function(data, options) {
      var me = this, deferred = $.Deferred();
      if (me.options && me.options.externalShare && me.options.externalShare.core && options && options.shareInfo && options.shareInfo.stopShare) {
        var isNewNode = options.shareInfo.useCorePath;
        this._getNodeForPerformingStopShare(data, options, isNewNode).done(function(node) {
          me._stopShare(node, options).done(function() {
            deferred.resolve();
          }).fail(function(error) {
            deferred.reject(error);
          });
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    _getNodeForPerformingStopShare: function(data, options, isNewNode) {
      var deferred = $.Deferred();
      if (isNewNode) {
        var newid = data.properties["r_object_id"];
        var model = new NodeModel({
          id: newid
        }, {
          connector: this.status.collection.connector
        });
        CommandHelper.refreshNode(model).done(function() {
          deferred.resolve(model);
        }).fail(function(error) {
          deferred.reject(error);
        });
      } else {
        deferred.resolve(options.node);
      }
      return deferred.promise();
    },
    _blockAction: function() {
      this.status.originatingView && this.status.originatingView.blockActions && this.status.originatingView.blockActions();
    },
    _unblockAction: function() {
      this.status.originatingView && this.status.originatingView.unblockActions && this.status.originatingView.unblockActions();
    },
    _stopShare: function(node) {
      var me = this, deferred = $.Deferred(), url = CommandHelper.getOriginalActionLink(node, this.command.get("signature"), RestLinkrels.D2_SHARE_TO_CORE);
      me._blockAction();
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "DELETE",
        success: function() {
          me._unblockAction();
          deferred.resolve();
        },
        error: function(xhr) {
          me._unblockAction();
          var errorDetails = utils.parseAjaxError(xhr);
          if (utils.isMobile()) {
            errorDetails.status = xhr.status;
          }
          deferred.reject(errorDetails);
        }
      }));
      return deferred.promise();
    },
    _uploadFile: function(status, node, files, checkinconfig, ctfEnabled) {
      var deferred = $.Deferred();
      var checkinurl = this.getCheckinLink(node);
      var options = {
        node: node,
        file: files[0],
        data: {
          general: {}
        },
        config: checkinconfig,
        checkinurl: checkinurl,
        ctfEnabled: ctfEnabled
      };
      if (utils.isAppworks()) {
        options.checkinFixedFile = this.options.isOfflineAddVersion;
      }
      if (files[0]) {
        var formatlist = AddVersionUtils.getFormats(files[0].name);
        var defaultformat = AddVersionUtils.getDefaultFormat(formatlist);
        if (defaultformat) {
          options.data.general["a_content_type"] = defaultformat.value;
        }
      }
      var externalShare = this.options.externalShare;
      if (externalShare && externalShare.core) {
        options.externalShare = externalShare;
        if (externalShare.shareMode === constants.ShareIntentType.PUBLISH) {
          options.data.general["add_version_to_core"] = true;
        } else if (externalShare.shareMode === constants.ShareIntentType.COLLABORATE) {
          options.data.general["retain_lock"] = true;
          options.shareInfo = {
            useCorePath: true
          };
        }
      }
      options.isRootVDCheckin = this.options.isRootVDCheckin;
      this.refresh = true;
      this.initiateFileUploader(options).done(deferred.resolve).fail(deferred.reject);
      return deferred.promise();
    },
    _checkinFile: function(status, node, files, ctfEnabled) {
      var deferred = $.Deferred();
      var me = this;
      var fetchPropertyPage = _.bind(this._fetchPropertyPageAndOpenAddVersionDialog, this);
      var openAddVersionDlg = _.bind(this._openDlg, this);
      var uploadFile = _.bind(this._uploadFile, this);
      var checkin = _.bind(function(checkinconfig) {
        checkinconfig.properties = checkinconfig["config-properties"];
        if (checkinconfig.properties["silent_checkin"] && !checkinconfig.properties["can_log_entry"]) {
          var validationStatus = CreationUtils.filterFiles(files);
          if (files.length === 1 && !validationStatus.status) {
            if (validationStatus.validFiles[0].isAllowedEnding === false) {
              CreationUtils.showInvalidEndingsMesssage(files[0]);
            } else {
              AlertDialog.showInfo(validationStatus.message);
            }
            me._cancelCheckout();
            return deferred.resolve().promise();
          }
        }
        if (!checkinconfig["checkin-version-options"]) {
          AlertDialog.showError(commandLang.AddVersionCheckinNoPermissionFailMsg).always(function() {
            me._cancelCheckout(true);
            deferred.resolve();
          });
        } else if (checkinconfig.properties["silent_checkin"] && !checkinconfig.properties["property_page"] && !checkinconfig.properties["can_log_entry"] && !this.options.showProcessingStep) {
          uploadFile(status, node, files, checkinconfig, ctfEnabled).done(function(data) {
            deferred.resolve(data);
          }).fail(function(error) {
            deferred.reject(error);
          });
        } else if (checkinconfig.properties["property_page"]) {
          fetchPropertyPage(status.originatingView, node, checkinconfig, files[0], ctfEnabled).done(function(data) {
            deferred.resolve(data);
          }).fail(function(error) {
            deferred.reject(error);
          });
        } else {
          openAddVersionDlg(status.originatingView, node, checkinconfig, files[0], null, ctfEnabled).done(function(data) {
            deferred.resolve(data);
          }).fail(function(error) {
            deferred.reject(error);
          });
        }
      }, this);
      me.showValidationDialog(status).done(function() {
        if (_.isUndefined(me.checkinconfig)) {
          me.fetchCheckInConfig(node).done(function(checkinconfig) {
            checkin(checkinconfig);
          }).fail(function(error) {
            deferred.reject(error);
          });
        } else {
          checkin(me.checkinconfig);
        }
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _resolvePromise: function() {
      var me = this;
      setTimeout(function() {
        if (!me.files) {
          me.deferred.resolve();
        }
      }, 1e3);
      document.body.onfocus = null;
    },
    _reserveFile: function(status) {
      var deferred = $.Deferred();
      var node = CommandHelper.getJustOneNode(status);
      var reserveCommand = new ReserveCommand();
      var precheckurl = this.getPreCheckLink(node);
      var precheckUrlMap = {};
      precheckUrlMap[node.get("id")] = precheckurl;
      var reserveoptions = _.defaults({
        ignoreDownload: true,
        suppressProgress: true,
        hideSuccessMessage: true,
        hideFailureMessage: false,
        precheckUrlMap: precheckUrlMap
      }, this.options);
      var me = this;
      this._blockAction();
      reserveCommand.execute(status, reserveoptions).done(function(nodes) {
        me.reserved = true;
        status.nodes.set(nodes);
        deferred.resolve();
      }).fail(function(error) {
        deferred.reject(error);
      }).always(this._unblockAction.bind(this));
      return deferred.promise();
    },
    _reserveAndCheckin: function(status, files, ctfEnabled) {
      var deferred = $.Deferred();
      var node = CommandHelper.getJustOneNode(status);
      var checkinfile = _.bind(this._checkinFile, this);
      var me = this;
      function checkin() {
        if (files) {
          checkinfile(status, node, files, ctfEnabled).done(function(data) {
            deferred.resolve(data);
          }).fail(function(error) {
            deferred.reject(error);
          });
        } else {
          deferred.resolve();
        }
      }
      me.showValidationDialog(status).done(function() {
        if (me._isReserved(node)) {
          checkin();
        } else {
          me._reserveFile(status).done(function() {
            checkin();
          }).fail(function(error) {
            deferred.reject(error);
          });
        }
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _launchFileSelectorConfirmationDialog: function() {
      var dfd = $.Deferred();
      AlertDialog.confirmQuestion(function(result) {
        dfd.resolve(result);
      }, commandLang.AddVersionFileNotFoundMsg, commandLang.AddVersionFileNotFoundTitle, {
        buttons: {
          showYes: true,
          showNo: false,
          showCancel: true
        }
      });
      return dfd.promise();
    },
    _isReserved: function(node) {
      var currentLoggedInUserId = RestResources.getCurrentUser().id;
      var reservedUserId = node.get("reserved_user_id");
      return !!(node.get("reserved") && currentLoggedInUserId === reservedUserId);
    },
    _addVersionUsingCtf: function(successCb, failureCb, reserved, externalFile) {
      var checkinfile = _.bind(this._checkinFile, this), externalFilePath = externalFile && externalFile.name, reserveAndCheckin = _.bind(this._reserveAndCheckin, this), status = this.status, me = this, ignoreFileSelect = !this.checkin_from_file_mandatory || !!externalFilePath;
      function proceedAddingVersion(path) {
        var node = CommandHelper.getJustOneNode(status);
        function checkin(fileData, isDownloaded) {
          var files = [];
          var filePath = fileData && fileData.file_path;
          var fileSize = fileData && fileData.file_size;
          if (externalFilePath || filePath) {
            var filename = externalFilePath ? externalFilePath : filePath && filePath.replace(/^.*[\\\/]/, "");
            var file;
            try {
              file = new File([ "" ], filename);
              file.path = filePath;
              file.size = fileSize;
            } catch (err) {
              file = {
                name: filename,
                path: filePath,
                size: fileSize
              };
            }
            files[0] = file;
          }
          me.files = files;
          if (reserved) {
            checkinfile(status, node, me.files, true).done(function(data) {
              if (isDownloaded) {
                ctfBridge.publishRemoveFileFromCheckout(path, node.get("id"));
              }
              successCb(data);
            }).fail(function(error) {
              failureCb(error);
            });
          } else {
            reserveAndCheckin(status, me.files, true).done(function(data) {
              successCb(data);
            }).fail(function(error) {
              failureCb(error);
            });
          }
        }
        function launchSelector() {
          function selectFile() {
            var $backdrop = ctfUtils.getBackdropForFileUploader();
            ctfBridge.publishSelectFile(function(filearr) {
              $backdrop.remove();
              if (filearr && filearr[0]) {
                checkin(filearr[0], false);
              } else {
                successCb();
              }
            });
          }
          if (reserved) {
            me._launchFileSelectorConfirmationDialog().done(function(result) {
              if (result) {
                selectFile(reserved);
              } else {
                successCb();
              }
            });
          } else {
            selectFile(reserved);
          }
        }
        if (reserved) {
          if (ignoreFileSelect) {
            var fileData;
            if (me.options && me.options.checkinFixedFile && externalFile) {
              fileData = {
                file_path: externalFile.path,
                file_size: externalFile.size
              };
            }
            checkin(fileData);
          } else {
            ctfBridge.publishIsDownloaded(node.get("id"), path, function(file_path) {
              if (file_path) {
                ctfBridge.publishGetFileSize(node.get("id"), path, function(file_size) {
                  var fileData = {
                    file_path: file_path,
                    file_size: file_size
                  };
                  checkin(fileData, true);
                }, function() {
                  launchSelector();
                });
              } else {
                launchSelector();
              }
            }, function() {
              launchSelector();
            });
          }
        } else {
          launchSelector();
        }
      }
      var node = CommandHelper.getJustOneNode(this.status);
      if (reserved) {
        if (ignoreFileSelect) {
          proceedAddingVersion();
        } else {
          const downloadCommand = new DownloadCommand();
          downloadCommand.fetchDownloadUrls(node, RestLinkrels.getLink(node.get("links"), RestLinkrels.DOWNLOAD_URLS)).done((downloadUrls, pageServingUrls, bravacsrSearchInfoUrl, bravacsrSearchInfoFallbackUrl, formats, pageCount, downloadLocationPath) => {
            var path = downloadLocationPath.checkout;
            if (path) {
              proceedAddingVersion(path);
            } else {
              var title = "", startPath = "";
              ctfBridge.publishSelectFolder(title, "edit", startPath, function success(path) {
                var pref = {};
                pref[constants.UserSettings.DOWNLOAD_CHECKOUT_PATH] = path;
                userSettingsUtils.updateUserSettings(pref, {
                  connector: node.connector
                }).done(function() {
                  proceedAddingVersion(path);
                }).fail(function(err) {
                  failureCb(err);
                });
              }, function() {
                failureCb(new Error(commandLang.SelectResourceFailMessage));
              });
            }
          });
        }
      } else {
        proceedAddingVersion("");
      }
    },
    _addVersion: function(status) {
      this.checkin_from_file_mandatory = true;
      this.files = null;
      this.reserved = false;
      this.deferred = $.Deferred();
      var me = this, reserveAndCheckin = _.bind(this._reserveAndCheckin, this), thinModeFiles = _.filter(this.options.files, function(file) {
        return file instanceof File;
      }), ctfEnabled = thinModeFiles.length === 0 && ctfBridge.isCtfEnabled();
      if (me.options.files && !ctfEnabled) {
        me._fetchInitialDataForAddVersion().done(function() {
          me.files = me.options.files;
          reserveAndCheckin(status, me.files).done(function(data) {
            me.deferred.resolve(data);
          }).fail(function(err) {
            me.deferred.reject(err);
          });
        }).fail(function(err) {
          me.deferred.reject(err);
        });
      } else {
        var node = CommandHelper.getJustOneNode(this.status);
        var addVersion = _.bind(function() {
          if (ctfEnabled) {
            var reserved = this._isReserved(node);
            var addVersionUsingCTF = _.bind(this._addVersionUsingCtf, this);
            me._fetchInitialDataForAddVersion().done(function(file) {
              if (!file && me.options.files && me.options.files.length > 0) {
                file = me.options.files[0];
              }
              addVersionUsingCTF(function(data) {
                me.deferred.resolve(data);
              }, function(err) {
                me.deferred.reject(err);
              }, reserved, file);
            }).fail(function(err) {
              me.deferred.reject(err);
            });
          } else {
            if (me.options.externalShare && me.options.externalShare.core && me.options.externalShare.shareMode && me.options.externalShare.shareMode === constants.ShareIntentType.COLLABORATE) {
              me._fetchInitialDataForAddVersion().done(function(file) {
                if (file) {
                  me.options.files = [ file ];
                }
                me.files = me.options.files;
                reserveAndCheckin(status, me.files, ctfEnabled).done(function(data) {
                  me.deferred.resolve(data);
                }).fail(function(err) {
                  me.deferred.reject(err);
                });
              }).fail(function(err) {
                me.deferred.reject(err);
              });
            } else if (me.checkin_from_file_mandatory) {
              var fileOpenDialog = new FileOpenDialog({
                multiple: false
              });
              fileOpenDialog.listenTo(fileOpenDialog, "cancel:dialog", _.bind(me._resolvePromise, me));
              fileOpenDialog.listenTo(fileOpenDialog, "add:files", function(files) {
                me._fetchInitialDataForAddVersion().done(function() {
                  me.files = files;
                  reserveAndCheckin(status, files, ctfEnabled).done(function(data) {
                    me.deferred.resolve(data);
                  }).fail(function(err) {
                    me.deferred.reject(err);
                  });
                }).fail(function(err) {
                  me.deferred.reject(err);
                });
                fileOpenDialog.destroy();
              });
              fileOpenDialog.show();
            } else {
              reserveAndCheckin(status, [], ctfEnabled).done(function(data) {
                me.deferred.resolve(data);
              }).fail(function(err) {
                me.deferred.reject(err);
              });
            }
          }
        }, this);
        if (vdocUtils.isVirtualDoc(node) && this._isReserved(node)) {
          this.fetchCheckInConfig(node).done(function(checkinconfig) {
            me.checkinconfig = checkinconfig;
            me.checkinconfig.properties = checkinconfig["config-properties"];
            me.checkin_from_file_mandatory = checkinconfig.properties["checkin_from_file_mandatory"];
            addVersion();
          });
        } else {
          addVersion();
        }
      }
      let triggerVersionAdded = newId => {
        var oldId = CommandHelper.getJustOneNode(status).get("id");
        status.context.trigger("d2:object:versionadded", oldId, newId);
      };
      this.deferred.done(data => {
        let newId = data?.properties?.r_object_id;
        triggerVersionAdded(newId);
      }).fail(err => {
        if (err?.customData?.checkedin_object_id) {
          triggerVersionAdded(err.customData.checkedin_object_id);
        }
      });
      return this.deferred.promise();
    },
    fetchPropertyPage: function(node, checkinconfig) {
      var me = this, deferred = $.Deferred();
      var url = RestLinkrels.getLink(checkinconfig.links, RestLinkrels.PROPERTY_PAGE);
      if (checkinconfig.properties["property_page"] && !url) {
        deferred.reject(new Error(commandLang.AddVersionLinkRelMissing));
      } else if (url) {
        me._blockAction();
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          headers: {
            Accept: constants.MediaTypes.DCTM_D2_V1_JSON,
            "Content-Type": constants.MediaTypes.DCTM_D2_V1_JSON
          },
          success: function(response) {
            var propertyPageDetails = {
              propertyDialog: response["page-content"],
              externalEsign: response["external-esign-off"],
              externalAuditURL: RestLinkrels.getLink(response["links"], RestLinkrels.D2_EXTERNAL_SIGN_OFF_AUDIT_EVENTS)
            };
            me._unblockAction();
            deferred.resolve(propertyPageDetails);
          },
          error: function(xhr) {
            var errorDetails = utils.parseAjaxError(xhr);
            if (utils.isMobile()) {
              errorDetails.status = xhr.status;
            }
            me._unblockAction();
            deferred.reject(errorDetails);
          }
        }));
      }
      return deferred.promise();
    },
    initiateFileUploader: function(options) {
      this.getFileUploadCollection(options);
      var deferred = $.Deferred(), uploadModel = this.uploadCollection && this.uploadCollection.at(0), me = this;
      this.progressPanel = uploadModel && this.startProgressPanel();
      this.executeUploadFile(options).progress(function(progressData) {
        deferred.notify(progressData);
        if (uploadModel && progressData) {
          uploadModel.set("count", progressData.count);
        }
      }).done(function(data) {
        this._refreshPage(data, options).done(deferred.resolve).fail(deferred.reject).always(function() {
          uploadModel.set({
            name: CommandHelper.getJustOneNode(me.status).get("name")
          }, {
            silent: true
          });
          var showTargetLocation = (me.status.container && _.contains(CommandHelper.getJustOneNode(me.status).get("i_folder_id"), me.status.container.get("id"))) === true ? undefined : true;
          if (options.file && me.options.contentUploadValidator && me.options.contentUploadValidator instanceof BaseContentUploadValidator) {
            me.options.contentUploadValidator.validateUploadedContent({
              operation: constants.ContentUploadOps.CHECKIN,
              r_object_id: data.properties["r_object_id"],
              contentUploadResponse: data,
              file: options.file
            }).done(() => {
              uploadModel && uploadModel.set({
                state: "resolved",
                targetLocation: showTargetLocation
              });
            }).fail(errorMessage => {
              uploadModel && uploadModel.set({
                resolvedToastMessage: errorMessage,
                showSuccessAsWarning: true
              }, {
                silent: true
              });
              uploadModel && uploadModel.set({
                state: "resolved",
                targetLocation: true
              });
            });
          } else {
            uploadModel && uploadModel.set({
              state: "resolved",
              targetLocation: showTargetLocation
            });
          }
        });
      }.bind(this)).fail(error => {
        this._handleFailure(error, uploadModel, options).always(() => deferred.reject(error));
      });
      return deferred.promise();
    },
    _handleFailure: function(error, uploadModel, options) {
      let deferred = $.Deferred(), updateUploadModel = () => {
        if (uploadModel) {
          var errorMsg;
          if (error.responseText) {
            errorMsg = utils.parseAjaxErrorAsString(error);
          } else if (error.message) {
            errorMsg = error.message;
          }
          if (errorMsg) {
            uploadModel.set("errorMessage", errorMsg);
          }
          uploadModel.set("state", "rejected");
        }
      };
      let customData = error?.customData;
      if (customData?.checkin_success && customData?.checkedin_object_id) {
        let data = {
          properties: {
            r_object_id: customData.checkedin_object_id
          }
        };
        this.hideSuccessMessage = true;
        this._refreshPage(data, options).always(() => {
          updateUploadModel();
          deferred.resolve();
        });
      } else {
        updateUploadModel();
        deferred.resolve();
      }
      return deferred.promise();
    },
    executeUploadFile: function(options) {
      var deferred = $.Deferred(), fileuploader = new FileUploader(options);
      if (!options.ctfEnabled || AddVersionUtils.isForceThinClientMode(options)) {
        fileuploader.upload(options).done(deferred.resolve).fail(deferred.reject).progress(function(progressData) {
          deferred.notify({
            total: progressData.total,
            count: progressData.count,
            done: progressData.count
          });
        });
      } else {
        fileuploader.uploadUsingCtf(deferred.resolve, deferred.reject, function(progressData) {
          deferred.notify({
            total: progressData.total,
            count: progressData.loaded,
            done: progressData.loaded
          });
        });
      }
      return deferred.promise();
    },
    getFileUploadCollection: function(options) {
      var node = options.node, queueItems = [ {
        name: node.get("name"),
        state: "processing",
        count: 0,
        total: options.file ? options.ctfEnabled ? 100 : options.file.size : 0,
        node: node
      } ];
      this.uploadCollection = new UploadFileCollection(queueItems, {
        connector: node.connector
      });
      this.uploadCollection.each(function(item) {
        item.node = item.get("node");
        item.unset("node");
      });
    },
    getProgressMessageOptions: function() {
      var messageOptions = {
        actionType: "ADD_VERSION",
        link_command_signature: "Browse",
        oneFileSuccess: lang.FileUploadSuccess,
        oneFileFailure: lang.FileUploadFailure,
        enableCancel: false,
        enableMinimiseButton: true,
        isGlobalProgressPanel: true,
        gotoLocationLinkLabel: commandLang.CreateItemDoneCommandLabel,
        configActions: {
          enhancePanel: false
        },
        context: this.status.context
      };
      if (this.options.isRootVDCheckin) {
        messageOptions["oneFilePending"] = lang.RootFileUploadPending;
      } else {
        messageOptions["oneFilePending"] = lang.FileUploadPending;
        messageOptions["originatingView"] = this.status.originatingView;
      }
      return messageOptions;
    },
    startProgressPanel: function() {
      if (this.suppressProgress === true) {
        return;
      }
      return GlobalMessage.showProgressPanel(this.uploadCollection, _.defaults({
        enableCancel: false
      }, this.getProgressMessageOptions()));
    },
    getCheckinConfigLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.command.get("signature"), RestLinkrels.D2_CHECKIN_CONFIG);
    },
    getCheckinLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.command.get("signature"), RestLinkrels.D2_CHECKIN_URL);
    },
    getPreCheckLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, this.command.get("signature"), RestLinkrels.CHECKOUT_PRECHECK);
    },
    fetchCheckInConfig: function(node) {
      var me = this, deferred = $.Deferred(), href = this.getCheckinConfigLink(node);
      if (!href) {
        deferred.reject(new Error(commandLang.AddVersionLinkRelMissing));
      } else {
        me._blockAction();
        $.ajax(node.connector.extendAjaxOptions({
          url: href,
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            me._unblockAction();
            deferred.resolve(response);
          },
          error: function(xhr) {
            me._unblockAction();
            var errorDetails = utils.parseAjaxError(xhr);
            if (utils.isMobile()) {
              errorDetails.status = xhr.status;
            }
            deferred.reject(errorDetails);
          }
        }));
      }
      return deferred.promise();
    },
    showValidationDialog: function(status) {
      var validationDialog = new ValidationDialog({
        status: status,
        nodeModels: CommandHelper.getAtLeastOneNode(status).models,
        className: "d2-lifecycle-validation-dialog",
        command: this.command
      });
      return validationDialog.show();
    }
  });
  AddVersionManager.extend = Backbone.View.extend;
  return AddVersionManager;
});