/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commandhelper", "nuc/utils/url", "dctmw/utils/utils", "d2/dialogs/validation/validation.dialog", "d2/utils/rest.linkrels", "i18n!d2/dialogs/digital.signature/impl/nls/lang" ], function($, _, CommandHelper, Url, utils, ValidationDialog, RestLinkrels, lang) {
  function DigitalSignatureValidationDialog(options) {
    ValidationDialog.prototype.constructor.call(this, options);
  }
  _.extend(DigitalSignatureValidationDialog.prototype, ValidationDialog.prototype, {
    validateDocuments: function(options) {
      var deferred = $.Deferred();
      this.checkEntryCondition(options).done(function(errorNode, validDocuments) {
        deferred.resolve(errorNode, validDocuments);
      }).fail(function(err) {
        deferred.reject(err);
      });
      return deferred.promise();
    },
    checkEntryCondition: function(options) {
      var deferred = $.Deferred(), me = this, nodeIds = options.documents && options.documents.map(function(model) {
        return model.get("id");
      }), signConfig = options.node.digitalSignatureModel;
      var url = RestLinkrels.getLink(signConfig.get("links"), RestLinkrels.D2_DIGITAL_SGINATURE_VALDATION), qParams = {
        "object-ids": nodeIds
      };
      $.ajax(options.node.connector.extendAjaxOptions({
        url: Url.appendQuery(url, Url.combineQueryString(qParams)),
        success: function(response) {
          var validAndErrorDocuments = me._getValidAndErrorDocuments(options.documents.allModels, response);
          deferred.resolve(validAndErrorDocuments.errorDocuments, validAndErrorDocuments.validDocuments);
        },
        error: deferred.reject
      }));
      return deferred.promise();
    },
    getBodyMessage: function(options, hasNonErrorItems) {
      if (hasNonErrorItems) {
        if (options.errorNodes.length === 1) {
          return lang.OneFileFailedMessage;
        }
        return lang.SomeDocumentsFailedMessage;
      } else {
        if (options.errorNodes.length === 1) {
          return lang.SelectedOneDocumentFailed;
        }
        return lang.AllDocumentsFailedMessage;
      }
    },
    getMessagesConfiguredCount: function(errorMessages) {
      var messageCount = 0;
      for (var idx = 0; idx < errorMessages.length; idx++) {
        if (errorMessages[idx].message) {
          messageCount++;
        }
        if (messageCount > 1) {
          break;
        }
      }
      return messageCount;
    },
    getDialogTitle: function() {
      if (utils.isMobile()) {
        return lang.MobileDialogTitle;
      }
      return lang.DialogTitle;
    }
  });
  return DigitalSignatureValidationDialog;
});