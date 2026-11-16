/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/utils/url", "d2/controls/globalmessage/globalmessage", "csui/dialogs/modal.alert/modal.alert", "csui/models/command", "nuc/models/node/node.model", "csui/utils/commandhelper", "d2/dialogs/digital.signature/documents.validation/digital.signature.validation.dialog", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, Url, GlobalMessage, ModalAlert, CommandModel, NodeModel, CommandHelper, DigitalSignValidationDialog, constants, RestLinkrels, utils, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-DigitalSignature",
      command_key: "D2-DigitalSignature",
      scope: "single"
    },
    enabled: function(status, options) {
      var digitalSignEnabled = options.digitalSignEnabled ? true : false;
      return digitalSignEnabled;
    },
    execute: function(status, options) {
      var node = options.node;
      this.options = options;
      var self = this;
      var deferred = $.Deferred();
      self._authenticateChecker(options, node).done(function() {
        self._createDocumentSignature(options, node).done(function(updateUrl) {
          self._updateSignatueCompleteStatus(node, updateUrl).done(function() {
            deferred.resolve();
          }).fail(deferred.reject);
        }).fail(deferred.reject);
      }).fail(deferred.reject);
      return deferred.promise();
    },
    _updateSignatueCompleteStatus: function(node, updateUrl) {
      var deferred = $.Deferred();
      var signConfig = node.digitalSignatureModel;
      var url = updateUrl;
      if (!signConfig || !url) {
        return deferred.reject(lang.DigitalSignatureMissingConfigOrUrl).promise();
      } else {
        url = Url.appendQuery(url, Url.combineQueryString({
          "signature-provider": signConfig.get("signature_provider")
        }));
        var me = this;
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          type: "PUT",
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            var status = me._processStatusResponse(node, response);
            node.digitalSignatureModel.set("signStatus", status);
            deferred.resolve(response);
          },
          error: function() {
            deferred.reject();
          }
        }));
      }
      return deferred.promise();
    },
    validateNode: function(options) {
      var dialog = new DigitalSignValidationDialog(options);
      return dialog.show();
    },
    _createDocumentSignature: function(options, node) {
      var postData = {};
      var workingDocs = options.documents.map(function(model) {
        return {
          r_object_id: model.get("id")
        };
      });
      var supportingDocs = options.supportingDocs.map(function(model) {
        return {
          r_object_id: model.get("id")
        };
      });
      var count = options.digitalSignatureModel.get("default_signer_order");
      var signerList = [];
      options.signers.each(function(signerGroup) {
        var userListCollection = signerGroup.get("usersList");
        if (userListCollection) {
          userListCollection.each(function(model) {
            signerList.push({
              email: model.get("user_address"),
              full_name: model.get("id"),
              signer_order: count
            });
          });
          count++;
        } else {
          signerList.push({
            email: signerGroup.get("user_address"),
            full_name: signerGroup.get("id"),
            signer_order: count
          });
        }
      });
      postData.signers = signerList;
      postData.working_documents = workingDocs;
      postData.supporting_documents = supportingDocs;
      postData.message = options.message ? options.message : "";
      postData.subject = options.subject ? options.subject : "";
      var deferred = $.Deferred(), signConfig = node.digitalSignatureModel;
      var url = RestLinkrels.getLink(signConfig.get("links"), RestLinkrels.D2_DIGITAL_SIGNATURES);
      var me = this;
      this._blockActions(options.originatingView);
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(postData),
        success: function(response) {
          me._unblockActions(options.originatingView);
          var redirect_url = me.getDocumentSignRedirectUrl("oauth2-login-cb.html", options), loginOptions = {
            redirect_url: redirect_url,
            url: Url.appendQuery(response.prepare_url, Url.combineQueryString({
              redirect_url: redirect_url
            })),
            messageListener: me._attachDigitalSignPrepareMessageListener,
            langMessages: me._getDigitalSignPrepareMessages()
          };
          var url = RestLinkrels.getLink(response.links, RestLinkrels.SELF);
          if (url) {
            me._login(node, loginOptions).done(function() {
              deferred.resolve(url);
            }).fail(function() {
              deferred.reject();
            });
          } else {
            deferred.reject();
          }
        },
        error: function(request) {
          GlobalMessage.showMessage("error", request.responseJSON.message, request.responseJSON.details);
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    getDocumentSignRedirectUrl: function(oAuthPage) {
      return $("<a>").prop("href", oAuthPage).prop("href") + "#operation=completed";
    },
    _authenticateChecker: function(options, node) {
      var deferred = $.Deferred(), signConfig = node.digitalSignatureModel, me = this;
      this._blockActions(options.originatingView);
      var url = RestLinkrels.getLink(signConfig.get("links"), RestLinkrels.D2_DIGITAL_SIGNATURE_AUTH_CHECKER);
      $.ajax(node.connector.extendAjaxOptions({
        url: url,
        success: function() {
          me._unblockActions(options.originatingView);
          deferred.resolve();
        },
        error: function(request) {
          me._unblockActions(options.originatingView);
          if (request.status === 403) {
            me.coreAuthUrl = request.getResponseHeader("Location");
            var loginOptions = {
              url: me.coreAuthUrl,
              isAuthLogin: true,
              messageListener: me._attachLoginMessageListener,
              langMessages: me._getDigitalSignLoginMessages()
            };
            me._login(node, loginOptions).done(function() {
              deferred.resolve();
            }).fail(function() {
              deferred.reject();
            });
          } else {
            deferred.reject();
          }
        }
      }));
      return deferred.promise();
    },
    _login: function(node, options) {
      var me = this, deferred = $.Deferred();
      me._externalWnd = me._openWindow(node, options.url);
      if (!me._externalWnd) {
        ModalAlert.showWarning(function() {
          deferred.reject();
        }, lang.DigitalSignPopupWarning, lang.DigitalSignPopupTitle);
      } else {
        var wndChecker = function() {
          if (deferred.state() === "pending") {
            if (!me._externalWnd || me._externalWnd.closed) {
              window.removeEventListener("message", me._msgListener);
              me._modalMessage && me._modalMessage.close();
              deferred.reject();
            } else {
              setTimeout(wndChecker, 250);
            }
          }
        };
        setTimeout(wndChecker, 250);
        options.messageListener(deferred, function() {
          GlobalMessage.showMessage("error", options.langMessages.errorTitle);
        }, this);
        me._modalMessage = ModalAlert.showInformation(function() {
          window.removeEventListener("message", me._msgListener);
          if (!me._externalWnd || !me._externalWnd.closed) {
            me._externalWnd && me._externalWnd.close();
            deferred.reject();
          }
        }, options.langMessages.message, lang.DigitalSignTitle, {
          buttons: {
            showYes: false,
            showNo: false,
            showCancel: true,
            labelCancel: options.langMessages.cancelBtn
          }
        });
      }
      return deferred.promise();
    },
    _openWindow: function(node, url) {
      var height = Math.min(Math.max(window.outerHeight - 200, 500), 800), width = Math.min(Math.max(window.outerWidth - 150, 700), 1e3);
      return window.open(url, "d2_oauth_login_dialog", "scrollbars=yes,resizable=yes" + ",height=" + height + ",width=" + width + ",top=" + (window.screenTop + (window.outerHeight - height) / 2) + ",left=" + (window.screenLeft + (window.outerWidth - width) / 2));
    },
    _attachLoginMessageListener: function(deferred, errCb, action) {
      action._msgListener = function(e) {
        action._callBackProcessor();
        var data = e.message || e.data;
        var jsonData = {};
        if (_.isString(data)) {
          jsonData = data && JSON.parse(data);
        } else {
          jsonData = data;
        }
        if (jsonData) {
          deferred.resolve(jsonData);
        } else {
          errCb("Error", "Error occured");
        }
      };
      action._attachMessageListner(action._msgListener);
    },
    _attachDigitalSignPrepareMessageListener: function(deferred, errCb, action) {
      action._msgListener = function(e) {
        var data = e.message || e.data;
        var jsonData = {};
        if (_.isString(data)) {
          jsonData = data && JSON.parse(data);
        } else {
          jsonData = data;
        }
        if (jsonData && jsonData.operation) {
          if (jsonData.operation === "completed") {
            action._callBackProcessor();
            deferred.resolve(jsonData);
          } else {
            errCb("Error", "Error occured");
          }
        }
      };
      action._attachMessageListner(action._msgListener);
    },
    _getDigitalSignPrepareMessages: function() {
      return {
        message: lang.DigitalSignPrepareMessage,
        cancelBtn: lang.DigitalSignPrepareCancelBtn,
        errorTitle: lang.DigitalSignaturePrepareURLError
      };
    },
    _getDigitalSignLoginMessages: function() {
      return {
        message: lang.DigitalSignLoginMessage,
        cancelBtn: lang.DigitalSignCancelBtn,
        errorTitle: lang.DigitalSignAuthError
      };
    },
    _callBackProcessor: function() {
      this._removeMessageListner(this._msgListener);
      this._externalWnd && this._externalWnd.close();
      this._modalMessage && this._modalMessage.close();
    },
    _attachMessageListner: function(msgListener) {
      window.addEventListener("message", msgListener, false);
    },
    _removeMessageListner: function(msgListener) {
      window.removeEventListener("message", msgListener);
    },
    _blockActions: function(view) {
      CommandHelper.blockD2ViewActions(view);
    },
    _unblockActions: function(view) {
      CommandHelper.unblockD2ViewActions(view);
    },
    checkDigitalSignatureStatus: function(node) {
      var deferred = $.Deferred();
      var signConfig = node.digitalSignatureModel;
      var url = RestLinkrels.getLink(node.get("links"), RestLinkrels.D2_DIGITAL_SIGNATURE);
      if (!url) {
        return deferred.resolve().promise();
      }
      if (!signConfig) {
        return deferred.reject().promise();
      } else {
        var me = this;
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          headers: {
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(response) {
            var status = me._processStatusResponse(node, response);
            node.digitalSignatureModel.set("signStatus", status);
            deferred.resolve(response);
          },
          error: deferred.reject
        }));
      }
      return deferred.promise();
    },
    _processStatusResponse: function(node, response) {
      var status = new Backbone.Model({});
      status.connector = node.connector;
      status.set("signature_status", response["signature_status"]);
      status.set("signers", response["signers"]);
      status.set("links", response.links);
      return status;
    }
  });
});