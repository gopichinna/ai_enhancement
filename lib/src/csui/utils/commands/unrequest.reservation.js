/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "module", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/url", "csui/utils/base", "csui/utils/commandhelper", "csui/utils/commands/node", "smart/dialogs/modal.alert/modal.alert", "csui/models/command" ], function(_, $, module, lang, Url, base, CommandHelper, NodeCommand, ModalAlert, CommandModel) {
  "use strict";
  var config = _.extend({}, module.config());
  var UnrequestReservationCommand = NodeCommand.extend({
    defaults: {
      command: "UnrequestReservation",
      signature: "UnrequestReservation",
      command_key: [ "unrequestreservation", "UnrequestReservation" ],
      name: lang.CommandNameUnrequestReservation,
      verb: lang.CommandVerbUnrequestReservation
    },
    enabled: function(status, options) {
      var self = this;
      this.status = status;
      this.options = options || {};
      var node = CommandHelper.getJustOneNode(status);
      var context = status.context;
      var current_user = context.getModel("user");
      if (!(node && current_user)) {
        return false;
      }
      if (current_user.has("id")) {
        if (node.has("reserved_user_id") && node.get("reserved_user_id") === current_user.get("id")) {
          return false;
        }
        if (node.has("is_request_in_queue") && node.get("is_request_in_queue") !== undefined) {
          return node.get("is_request_in_queue");
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
        self._confirmModal().then(function(answer) {
          if (answer) {
            var executeOptions = {
              url: Url.combine(baseUrl, "reservemanagement/nodes", node.get("id")),
              type: "DELETE"
            };
            self.connector.makeAjaxCall(executeOptions).done(function() {
              GlobalMessage.showMessage("success", lang.UnrequestReservationSuccessMessage);
              self.model.set({
                is_request_in_queue: false
              });
              self._deferred.resolve();
            }).fail(function(error) {
              GlobalMessage.showMessage("error", lang.UnrequestReservationFailMessage, error.responseJSON.error);
              self._deferred.reject();
            });
          }
        });
      }, self._deferred.reject);
      return self._deferred.promise();
    },
    _formatConfirmationResponse: function() {
      var modalMessage;
      var modalTitle = lang.ConfirmUnrequestReservationTitle;
      modalMessage = _.str.sformat(lang.ConfirmUnrequestReservationBody, this.model.get("name"));
      return {
        message: modalMessage,
        title: modalTitle
      };
    },
    _confirmModal: function() {
      var self = this;
      self._confirmationDeferred = $.Deferred();
      var confirmationData = self._formatConfirmationResponse();
      ModalAlert.confirmQuestion(confirmationData.message, confirmationData.title, {
        buttons: {
          showYes: true,
          showNo: true
        }
      }).always(function(answer) {
        if (answer) {
          self._confirmationDeferred.resolve(true);
        } else if (answer !== undefined) {
          self._confirmationDeferred.resolve(false);
        }
      });
      return self._confirmationDeferred.promise();
    }
  });
  return UnrequestReservationCommand;
});