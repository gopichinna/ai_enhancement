/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "smart/controls/globalmessage/globalmessage", "smart/dialogs/modal.alert/modal.alert", "dctmw/utils/utils", "i18n!dctmw/commands/nls/lang" ], function(_, $, CommandModel, GlobalMessage, ModalAlert, utils, lang) {
  "use strict";
  const RefreshList = CommandModel.extend({
    defaults: {
      signature: "D4-RefreshList",
      name: lang.CommandNameRefreshList,
      scope: "single"
    },
    execute: function(status, options) {
      const deferred = $.Deferred();
      if (status.toolItem && status.toolItem.get("suppressFailMessage")) {
        status.suppressFailMessage = true;
      }
      this._confirmRefresh(status).then(() => {
        status.originatingView && status.originatingView.trigger("before:refresh:list:data");
        status.collection.fetch(_.extend({}, options, {
          reload: true,
          skipSWCache: true
        })).done(function() {
          status.originatingView && status.originatingView.trigger("refresh:list:data");
          deferred.resolve();
        }).fail(function(error) {
          if (status.suppressFailMessage !== true) {
            let msg = error.message || error;
            if (error && error.responseText) {
              msg = utils.parseAjaxErrorAsString(error);
            }
            if (msg) {
              GlobalMessage.showMessage("error", msg);
            }
          }
          deferred.reject();
        });
      }, deferred.resolve);
      return deferred.promise();
    },
    _confirmRefresh: function(status = {}) {
      const dfd = $.Deferred();
      const collection = status.collection;
      if (!collection || !_.isFunction(collection.isStateDirty) || !collection.isStateDirty()) {
        dfd.resolve();
      } else {
        ModalAlert.confirmQuestion(lang.RefreshConfirmationMessage, lang.RefreshConfirmationAlertTitle, {
          buttons: {
            showYes: true,
            showNo: false,
            showCancel: true,
            labelYes: lang.RefreshConfirmationButtonLabel
          }
        }).always(answer => {
          answer === true ? dfd.resolve() : dfd.reject();
        });
      }
      return dfd.promise();
    }
  });
  return RefreshList;
});