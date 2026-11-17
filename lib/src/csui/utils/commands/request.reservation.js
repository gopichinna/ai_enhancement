/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "module", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/url", "csui/utils/base", "csui/utils/commandhelper", "csui/utils/commands/node", "smart/dialogs/modal.alert/modal.alert", "csui/models/command" ], function(_, $, module, lang, Url, base, CommandHelper, NodeCommand, ModalAlert, CommandModel) {
  "use strict";
  var config = _.extend({}, module.config());
  var RequestReservationCommand = NodeCommand.extend({
    defaults: {
      command: "RequestReservation",
      signature: "RequestReservation",
      command_key: [ "requestreservation", "RequestReservation" ],
      name: lang.CommandNameRequestReservation,
      verb: lang.CommandVerbRequestReservation
    },
    enabled: function(status, options) {
      var node = CommandHelper.getJustOneNode(status);
      var context = status.context;
      var current_user = context.getModel("user");
      if (!(node && current_user)) {
        return false;
      }
      if (current_user && current_user.has("id")) {
        if (!(node.has("reserved") && node.get("reserved"))) {
          return false;
        }
        var isReleaseOrRevision = _.contains([ 138, 139 ], node.get("type"));
        if (isReleaseOrRevision) {
          return false;
        }
        var isOlderVersion = node.has("versions") && node.get("versions").current_version === false;
        if (isOlderVersion) {
          return false;
        }
        if (node.has("reserved_user_id") && node.get("reserved_user_id") === current_user.get("id")) {
          return false;
        }
        if (node.has("is_request_in_queue") && node.get("is_request_in_queue") !== undefined) {
          return !node.get("is_request_in_queue");
        }
      } else {}
      return CommandModel.prototype.enabled.apply(this, arguments);
    },
    execute: function(status, options) {
      var node = CommandHelper.getJustOneNode(status);
      var self = this;
      this.options = options || {};
      this._deferred = $.Deferred();
      this.connector = this.options.connector || status.collection && status.collection.connector || status.container && status.container.connector || node.connector;
      this.model = node;
      require([ "csui/controls/globalmessage/globalmessage" ], function(GlobalMessage) {
        var baseUrl = new Url(self.connector.connection.url).getApiBase("v2");
        self._confirmModal(node, baseUrl).then(function(answer) {
          if (answer) {
            var executeOptions = {
              url: Url.combine(baseUrl, "reservemanagement/nodes", node.get("id")),
              type: "POST"
            };
            self.connector.makeAjaxCall(executeOptions).done(function() {
              GlobalMessage.showMessage("success", lang.RequestReservationSuccessMessage);
              self.model.set({
                is_request_in_queue: true
              });
              self._deferred.resolve();
            }).fail(function(error) {
              GlobalMessage.showMessage("error", lang.RequestReservationFailMessage, error.responseJSON.error);
              self._deferred.reject();
            });
          }
        });
      }, self._deferred.reject);
      return self._deferred.promise();
    },
    _formatConfirmationResponse: function(response) {
      var modalMessage;
      var result = response.results;
      var modalTitle = lang.ConfirmRequestReservationTitle;
      var reservedDate = base.formatExactDate(result.reserved_date);
      if (result.num_users === 0) {
        modalMessage = _.str.sformat(lang.ConfirmRequestReservationBodyNoWaiting, result.reserved_by, reservedDate);
      } else if (result.num_users === 1) {
        modalMessage = _.str.sformat(lang.ConfirmRequestReservationBodyOneWaiting, result.reserved_by, reservedDate);
      } else {
        modalMessage = _.str.sformat(lang.ConfirmRequestReservationBodyManyWaiting, result.reserved_by, reservedDate, result.num_users);
      }
      return {
        message: modalMessage,
        title: modalTitle
      };
    },
    _confirmModal: function(node, baseUrl) {
      var self = this;
      self._confirmationDeferred = $.Deferred();
      var getRequestedReservationNumOptions = {
        url: Url.combine(baseUrl, "reservemanagement/nodes", node.get("id")),
        type: "GET"
      };
      this.connector.makeAjaxCall(getRequestedReservationNumOptions).then(function(response) {
        if (!response.results.already_requested) {
          var confirmationData = self._formatConfirmationResponse(response);
          ModalAlert.confirmQuestion(confirmationData.message, confirmationData.title, {
            buttons: {
              showYes: true,
              labelYes: lang.BtnConfirmRequestReservation,
              showNo: true,
              labelNo: lang.BtnCancel
            }
          }).always(function(answer) {
            if (answer) {
              self._confirmationDeferred.resolve(true);
            } else if (answer !== undefined) {
              self._confirmationDeferred.resolve(false);
            }
          });
        } else {
          ModalAlert.showError(lang.RequestReservationErrorAlreadyRequested).always(function() {
            self._confirmationDeferred.reject();
          });
        }
      }).fail(function(error) {
        ModalAlert.showError(error.responseJSON.error).always(function() {
          self._confirmationDeferred.reject();
        });
      });
      return self._confirmationDeferred.promise();
    }
  });
  return RequestReservationCommand;
});