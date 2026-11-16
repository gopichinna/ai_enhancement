/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/utils/commandhelper", "nuc/utils/url", "dctmw/utils/utils", "d2/dialogs/validation/validation.dialog", "d2/utils/rest.linkrels", "i18n!d2/dialogs/launch.workflow/impl/nls/lang" ], function($, _, CommandHelper, Url, utils, ValidationDialog, RestLinkrels, lang) {
  function WorkflowValidationDialog(options) {
    ValidationDialog.prototype.constructor.call(this, options);
  }
  _.extend(WorkflowValidationDialog.prototype, ValidationDialog.prototype, {
    validateDocuments: function(options) {
      var deferred = $.Deferred();
      if (options.fileType === "supporting") {
        deferred.resolve([], options.nodeModels);
      } else {
        this.checkEntryCondition(options).done(function(errorNode, validDocuments) {
          deferred.resolve(errorNode, validDocuments);
        }).fail(function(err) {
          deferred.reject(err);
        });
      }
      return deferred.promise();
    },
    checkEntryCondition: function(options) {
      var deferred = $.Deferred(), me = this, nodeIds = options.nodeModels && _.map(options.nodeModels, function(node) {
        return node.get("id");
      });
      var url = CommandHelper.getOriginalActionLink(CommandHelper.getAtLeastOneNode(options.status).first(), options.command.get("signature"), RestLinkrels.D2_WORKFLOW_ENTRY_CONDITION_CHECKER, null, options.status.data), qParams = {
        "packagetype-validation-required": true,
        "object-ids": nodeIds
      };
      $.ajax(options.node.connector.extendAjaxOptions({
        url: Url.appendQuery(url, Url.combineQueryString(qParams)),
        success: function(response) {
          var validAndErrorDocuments = me._getValidAndErrorDocuments(options.nodeModels, response);
          deferred.resolve(validAndErrorDocuments.errorDocuments, validAndErrorDocuments.validDocuments);
        },
        error: deferred.reject
      }));
      return deferred.promise();
    },
    getBodyMessage: function(options, hasNonErrorItems) {
      if (utils.isMobile()) {
        var messageCount;
        if (hasNonErrorItems) {
          if (options.errorNodes.length === 1) {
            messageCount = this.getMessagesConfiguredCount(options.errorNodes[0].errorMessages);
            if (messageCount > 0) {
              if (messageCount === 1) {
                return _.str.sformat(lang.MobileSelectedOneDocumentFailedWithSingleMessage, options.errorNodes[0].name);
              } else {
                return _.str.sformat(lang.MobileSelectedOneDocumentFailedWithMultipleMessages, options.errorNodes[0].name);
              }
            } else {
              return _.str.sformat(lang.OneFileFailedMessageMobile, options.errorNodes[0].name);
            }
          }
          return _.str.sformat(lang.SomeDocumentsFailedMessageMobile, options.errorNodes.length, options.nodeModels.length);
        } else {
          if (options.errorNodes.length === 1) {
            messageCount = this.getMessagesConfiguredCount(options.errorNodes[0].errorMessages);
            if (messageCount > 0) {
              if (messageCount === 1) {
                return _.str.sformat(lang.MobileSelectedOneDocumentFailedWithSingleMessage, options.errorNodes[0].name);
              } else {
                return _.str.sformat(lang.MobileSelectedOneDocumentFailedWithMultipleMessages, options.errorNodes[0].name);
              }
            } else {
              return _.str.sformat(lang.OneFileFailedMessageMobile, options.errorNodes[0].name);
            }
          }
          return lang.AllDocumentsFailedMessage;
        }
      } else {
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
  return WorkflowValidationDialog;
});