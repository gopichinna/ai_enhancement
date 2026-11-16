/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/marionette", "nuc/models/node/node.model", "nuc/models/nodes", "nuc/utils/url", "csui/utils/contexts/factories/connector", "csui/utils/commandhelper", "csui/controls/dialog/dialog.view", "d2/controls/globalmessage/globalmessage", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/utils", "dctmw/utils/rest.resources", "d2/commands/reserve", "d2/commands/unreserve", "d2/controls/globalmessage/impl/progresspanel/node.creation.success.message.view", "d2/commands/open.plugins/impl/publish/publish.dialog.body.view", "d2/commands/open.plugins/impl/publish/publish.fields.constant", "i18n!d2/commands/open.plugins/nls/localized.strings", "css!d2/commands/open.plugins/impl/publish/publish.dialog" ], function($, _, Marionette, NodeModel, NodeCollection, Url, ConnectorFactory, CommandHelper, DialogView, GlobalMessage, RestLinkrels, constants, utils, RestResources, ReserveCommand, UnReserveCommand, NodeCreationSuccessMessageView, DialogBodyView, PublishFieldsConstant, lang) {
  "use strict";
  var dialogAlreadyOpen = false;
  var publishDialog = Marionette.Object.extend({
    initialize: function(options) {
      this.saveButtonId = "publish-save";
      this.options = options;
      this.node = this.options.node.clone();
      this.container = this.node.parent;
      this._connector = this.options.context.getObject(ConnectorFactory);
    },
    show: function() {
      if (dialogAlreadyOpen) {
        return;
      }
      dialogAlreadyOpen = true;
      var me = this, deferred = $.Deferred();
      var currentUser = RestResources.getCurrentUser();
      if (currentUser && currentUser.attributes && currentUser.attributes.properties && currentUser.attributes.properties.client_capability === 1) {
        this.downloadAction();
        return deferred.resolve().promise();
      }
      this._blockActions();
      this.container.fetch().done(function() {
        me.filterVersionAndRenditionPermission().done(function(filtered) {
          me.options.addExtraOptions = filtered;
          if (_.contains(me.options.addExtraOptions, PublishFieldsConstant.publishOptions.VERSION)) {
            me._reserveFile(me.node).done(function() {
              me.fetchCheckInConfig(me.options.node).done(function(checkinconfig) {
                me.setCheckinConfig(checkinconfig);
                var dialog = me.showDialog(checkinconfig);
                me._unblockActions();
                deferred.resolve({
                  dialog: dialog
                });
              }).fail(function(error) {
                me._unblockActions();
                deferred.reject(error);
              });
            }).fail(function(error) {
              me.reserveFileError = error[0]["message"];
              var dialog = me.showDialog();
              me._unblockActions();
              deferred.resolve({
                dialog: dialog
              });
            });
          } else {
            var dialog = me.showDialog();
            me._unblockActions();
            deferred.resolve({
              dialog: dialog
            });
          }
        });
      });
      return deferred.promise();
    },
    filterVersionAndRenditionPermission: function() {
      var me = this, deferred = $.Deferred();
      var versionPreCheckUrl = this.getPreCheckLink(this.node);
      this.getPermission().done(function(response) {
        var filtered = me.options.addExtraOptions.filter(function(value) {
          if (value === PublishFieldsConstant.publishOptions.VERSION && !versionPreCheckUrl) {
            return false;
          } else if (value === PublishFieldsConstant.publishOptions.RENDITION && !_.contains([ "Delete", "Write" ], response["basic-permission"])) {
            return false;
          } else {
            return true;
          }
        });
        deferred.resolve(filtered);
      });
      return deferred.promise();
    },
    getPermission: function() {
      var url = RestLinkrels.getLink(this.node.get("links"), RestLinkrels.D2_OBJECT_PERMISSIONS);
      return $.ajax(this._connector.extendAjaxOptions({
        url: url,
        method: "GET"
      }));
    },
    showDialog: function(checkinConfig) {
      var me = this;
      this.dialogBodyView = new DialogBodyView({
        node: this.options.node,
        checkinConfig: checkinConfig,
        context: this.options.context,
        addExtraOptions: this.options.addExtraOptions,
        reserveFileError: this.reserveFileError,
        container: this.container,
        defaultFileName: this.options.defaultFileName
      });
      this.dialog = new DialogView({
        title: lang.PublishDialogTitle,
        iconLeft: "csui-icon-notification-confirmation-white",
        view: this.dialogBodyView,
        className: "d2-publish-dialog",
        midSize: true,
        buttons: [ {
          id: this.saveButtonId,
          label: lang.SaveButtonText,
          default: true,
          disabled: true,
          click: function() {
            me.saveDialog();
          }.bind(this)
        }, {
          label: lang.CancelButtonText,
          close: true
        } ]
      });
      this.dialog.listenTo(this.dialog, "hide", _.bind(this.onHideDialog, this));
      this.dialog.listenToOnce(this.dialog, "after:show", me.onDialogShown());
      this.listenTo(this.dialogBodyView, "change:field", me.updateForm.bind(this));
      this.listenTo(this.dialogBodyView, "valid:field", this.validateAndUpdateFooterButton.bind(this));
      this.listenTo(this.dialogBodyView, "invalid:field", this.validateAndUpdateFooterButton.bind(this));
      this.listenTo(this.dialogBodyView, "render", this.validateAndUpdateFooterButton.bind(this));
      this.dialog.show();
      return this.dialog;
    },
    updateForm: function(event) {
      if (event.targetField.name === PublishFieldsConstant.publishFields.OPTIONS && event.targetField.value === PublishFieldsConstant.publishOptions.DOWNLOAD) {
        this.updateButtonText(this.saveButtonId, lang.DownloadButtonText);
      } else {
        this.updateButtonText(this.saveButtonId, lang.SaveButtonText);
      }
    },
    validateAndUpdateFooterButton: function() {
      this.dialogBodyView.validateForm(false, false).done(function(isValid) {
        if (isValid) {
          $(this.dialog.footerView.el).find("#" + this.saveButtonId).removeAttr("disabled");
        } else {
          $(this.dialog.footerView.el).find("#" + this.saveButtonId).attr("disabled", "true");
        }
      }.bind(this));
    },
    updateButtonText: function(id, text) {
      var button = this.dialog.footerView.collection.get(id);
      if (button) {
        var buttonView = this.dialog.footerView.children.findByModel(button);
        $(buttonView.el).text(text);
      }
    },
    onHideDialog: function() {
      dialogAlreadyOpen = false;
      if (this.options.node && this.reserved) {
        this._unReserveFile(this.node);
      }
    },
    saveDialog: function() {
      var me = this, formValues = this.dialogBodyView.form.getValue();
      if (formValues[PublishFieldsConstant.publishFields.OPTIONS] === PublishFieldsConstant.publishOptions.HOME_CABINET || formValues[PublishFieldsConstant.publishFields.OPTIONS] === PublishFieldsConstant.publishOptions.CURRENT_LOCATION || formValues[PublishFieldsConstant.publishFields.OPTIONS] === PublishFieldsConstant.publishOptions.BROWSE) {
        var currentLocation = formValues[PublishFieldsConstant.publishFields.OPTIONS] === PublishFieldsConstant.publishOptions.CURRENT_LOCATION ? true : false;
        this.saveToDocBase(currentLocation).done(function(response) {
          me.showSuccessMessage(response);
        }).fail(function() {
          me.dialog.kill();
          GlobalMessage.showMessage("error", lang.PublishErrorMessage);
        });
      }
      if (formValues[PublishFieldsConstant.publishFields.OPTIONS] === PublishFieldsConstant.publishOptions.VERSION) {
        this.saveVersion().done(function(response) {
          var responseJson = JSON.parse(response);
          var versionObj = _.findWhere(me.checkinConfig["checkin-version-options"], {
            version: responseJson.version
          });
          var successMessage = _.str.sformat(lang.PublishVersionSuccessMessage, responseJson.version, me.node.get("name"));
          if (versionObj && versionObj.version_policy === 2) {
            successMessage = _.str.sformat(lang.PublishVersionReplaceSuccessMessage, me.node.get("name"));
          }
          GlobalMessage.showMessage("success", successMessage);
        }).fail(function() {
          GlobalMessage.showMessage("error", lang.PublishErrorMessage);
        }).always(function() {
          me.dialog.kill();
        });
      }
      if (formValues[PublishFieldsConstant.publishFields.OPTIONS] === PublishFieldsConstant.publishOptions.RENDITION) {
        this.createRendition().done(function() {
          GlobalMessage.showMessage("success", lang.PublishRenditionSuccessMessage);
        }).fail(function(error) {
          var errorMessage = lang.PublishRenditionExistsMessage;
          if (error.status !== 503) {
            errorMessage = lang.PublishErrorMessage;
          }
          GlobalMessage.showMessage("error", errorMessage);
        }).always(function() {
          me.dialog.kill();
        });
      }
      if (formValues[PublishFieldsConstant.publishFields.OPTIONS] === PublishFieldsConstant.publishOptions.DOWNLOAD) {
        this.downloadAction();
        this.dialog.kill();
      }
    },
    showSuccessMessage: function(response) {
      var me = this, newNode, responseJson = JSON.parse(response);
      this._blockActions();
      newNode = this.getNodeModel(responseJson.r_object_id);
      newNode.fetch().done(function() {
        var successMessage = _.str.sformat(lang.PublishNewDocumentSuccessMessage, newNode.get("name"));
        if (me.container.get("id") === newNode.parent.get("id")) {
          GlobalMessage.showMessage("success", successMessage);
          me._unblockActions();
          me.dialog.kill();
        } else {
          var newNodeLocation = newNode.parent;
          newNodeLocation.fetch().done(function() {
            me.showSuccessMessageWithLocation(newNodeLocation, successMessage, me.options.context, true);
            me._unblockActions();
            me.dialog.kill();
          });
        }
      });
    },
    getNodeModel: function(docId) {
      return new NodeModel({
        id: docId
      }, {
        connector: this._connector
      });
    },
    showSuccessMessageWithLocation: function(node, msg, context, showLink) {
      GlobalMessage._showMessageView(NodeCreationSuccessMessageView, {
        showLink: showLink,
        node: node,
        context: context,
        successMessageFormat: msg,
        linkLabel: lang.PublishGoToLocation,
        link_command_signature: "Browse"
      });
    },
    downloadAction: function() {
      var link = document.createElement("a");
      link.setAttribute("download", "");
      link.setAttribute("target", "_blank");
      link.href = this.options.publishUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    saveToDocBase: function(currentLocation) {
      var url, formValues = this.dialogBodyView.form.getValue(), location, currentRepo = RestResources.getCurrentRepository().get("name");
      var param = {
        publishurl: this.options.publishUrl,
        filename: formValues[PublishFieldsConstant.publishFields.FILE_NAME],
        format: this.options.type,
        action: "docbase"
      };
      if (currentLocation) {
        location = this.node.parent.get("id");
      } else {
        location = formValues[PublishFieldsConstant.publishFields.FOLDER];
      }
      if (formValues[PublishFieldsConstant.publishFields.OPTIONS] === PublishFieldsConstant.publishOptions.HOME_CABINET) {
        param["action"] = "homecabinet";
      } else {
        param["location"] = location;
      }
      url = Url.combine(this._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "publish");
      return $.ajax(this._connector.extendAjaxOptions({
        url: url,
        method: "GET",
        data: param
      }));
    },
    saveVersion: function() {
      var url, formValues = this.dialogBodyView.form.getValue(), currentRepo = RestResources.getCurrentRepository().get("name"), checkinVersion = formValues[PublishFieldsConstant.publishFields.VERSION], action = checkinVersion === 1 ? "minorversion" : "majorversion";
      if (checkinVersion === 2) {
        action = "sameversion";
      }
      url = Url.combine(this._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "publish");
      var param = {
        publishurl: this.options.publishUrl,
        filename: this.node.get("name"),
        format: this.options.type,
        docId: this.node.get("id"),
        action: action
      };
      return $.ajax(this._connector.extendAjaxOptions({
        url: url,
        method: "GET",
        data: param
      }));
    },
    createRendition: function() {
      var url, currentRepo = RestResources.getCurrentRepository().get("name");
      url = Url.combine(this._connector.connection.url, "repositories", currentRepo, "bravaenterprise", "publish");
      var param = {
        publishurl: this.options.publishUrl,
        filename: this.node.get("name"),
        format: this.options.type,
        docId: this.node.get("id"),
        action: "rendition"
      };
      return $.ajax(this._connector.extendAjaxOptions({
        url: url,
        method: "GET",
        data: param
      }));
    },
    onDialogShown: function() {
      var me = this;
      var resizeFn = _.bind(me._doResize, me);
      setTimeout(function() {
        resizeFn();
      }, 500);
    },
    _doResize: function() {
      var newHeight = this.dialog.$el.find(".binf-modal-content").outerHeight(true);
      this.dialog.$el.find(".binf-modal-dialog").css("margin-top", (this.dialog.$el.height() - newHeight) / 2 + "px");
    },
    setCheckinConfig: function(checkinconfig) {
      this.checkinConfig = checkinconfig;
    },
    fetchCheckInConfig: function(node) {
      var deferred = $.Deferred(), href = this.getCheckinConfigLink(node);
      if (!href) {
        deferred.reject(new Error("need to check for config url"));
      } else {
        $.ajax(node.connector.extendAjaxOptions({
          url: href,
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            deferred.resolve(response);
          },
          error: function(xhr) {
            var errorDetails = utils.parseAjaxError(xhr);
            deferred.reject(errorDetails);
          }
        }));
      }
      return deferred.promise();
    },
    _reserveFile: function(node) {
      var me = this, deferred = $.Deferred(), reserveCommand = new ReserveCommand(), precheckurl = this.getPreCheckLink(node), precheckUrlMap = {};
      precheckUrlMap[node.get("id")] = precheckurl;
      var status = {
        nodes: new NodeCollection([ node ]),
        context: this.options.context
      };
      var reserveoptions = _.defaults({
        ignoreDownload: true,
        suppressProgress: true,
        hideSuccessMessage: true,
        hideFailureMessage: true,
        precheckUrlMap: precheckUrlMap,
        suppressConfirmationDialog: true
      }, this.options);
      reserveCommand.execute(status, reserveoptions).done(function(nodes) {
        me.reserved = true;
        status.nodes.set(nodes);
        deferred.resolve();
      }).fail(function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _unReserveFile: function(node) {
      var deferred = $.Deferred(), status = {
        nodes: new NodeCollection([ node ]),
        context: this.options.context
      };
      if (this.reserved) {
        var unreserveCommand = new UnReserveCommand();
        unreserveCommand.execute(status, {
          suppressProgress: true,
          hideSuccessMessage: true,
          hideFailureMessage: true
        }).always(function() {
          deferred.resolve();
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    },
    getCheckinConfigLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, "AddVersion", RestLinkrels.D2_CHECKIN_CONFIG);
    },
    getPreCheckLink: function(node) {
      return CommandHelper.getOriginalActionLink(node, "AddVersion", RestLinkrels.CHECKOUT_PRECHECK);
    },
    _blockActions: function() {
      $("div.load-container.csui-global").removeClass("binf-hidden");
    },
    _unblockActions: function() {
      $("div.load-container.csui-global").addClass("binf-hidden");
    }
  });
  return publishDialog;
});