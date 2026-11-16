/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/url", "csui/utils/commandhelper", "csui/utils/contexts/factories/connector", "d2/dialogs/validation/validation.dialog", "d2/utils/rest.linkrels", "d2/utils/constants", "dctmw/utils/utils", "d2/utils/node.utils", "i18n!d2/dialogs/lifecycle/impl/nls/lang" ], function($, _, Url, CommandHelper, ConnectorFactory, ValidationDialog, RestLinkrels, constants, utils, nodeUtils, lang) {
  function LifecycleValidationDialog(options) {
    ValidationDialog.prototype.constructor.call(this, options);
  }
  _.extend(LifecycleValidationDialog.prototype, ValidationDialog.prototype, {
    getBodyMessage: function(options, hasNonErrorItems) {
      if (options.command.get("signature") === "AddVersion") {
        return lang.AddVersionLifecycleValidationMessage;
      } else if (hasNonErrorItems) {
        if (options.errorNodes.length === 1 && options.validDocuments && options.validDocuments.length > 0) {
          return lang.OneFileFailedMessage;
        } else if (options.errorNodes.length === 1 && options.nodeModels.length === 1) {
          return lang.SelectedOneDocumentFailed;
        } else if (options.errorNodes.length === options.nodeModels.length) {
          return lang.AllDocumentsFailedMessage;
        } else {
          return lang.SomeDocumentsFailedMessage;
        }
      } else {
        if (options.errorNodes.length === 1) {
          if (utils.isMobile()) {
            var messageCount = this.getMessagesConfiguredCount(options.errorNodes[0].errorMessages);
            if (messageCount > 0) {
              if (messageCount === 1) {
                return _.str.sformat(lang.MobileSelectedOneDocumentFailedWithSingleMessage, options.errorNodes[0].name);
              } else {
                return _.str.sformat(lang.MobileSelectedOneDocumentFailedWithMultipleMessages, options.errorNodes[0].name);
              }
            } else {
              return _.str.sformat(lang.MobileSelectedOneDocumentFailed, options.errorNodes[0].name);
            }
          }
          return lang.SelectedOneDocumentFailed;
        }
        return lang.AllDocumentsFailedMessage;
      }
    },
    getDialogTitle: function() {
      return utils.isMobile() ? lang.MobileDialogTitle : lang.DialogTitle;
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
    validateDocuments: function() {
      var dfd = $.Deferred(), me = this, url = CommandHelper.getOriginalActionLink(CommandHelper.getAtLeastOneNode(me.options.status).first(), me.options.command.get("signature"), RestLinkrels.D2_OBJECTS_LIFECYCLE_CONDITIONS_CHECKER, null, me.options.status.data), nodeIds = me.options.nodeModels && _.map(me.options.nodeModels, function(model) {
        return model.get("id");
      }), queryParam = {
        inline: true
      }, data = {
        "object-ids": nodeIds
      }, connector = me.options.status.context && me.options.status.context.getObject(ConnectorFactory);
      var parent_id = nodeUtils.getParentId(me.options.status.nodes, {
        status: me.options.status
      });
      if (parent_id) {
        queryParam["parent-id"] = parent_id;
      }
      if (me.options.targetState) {
        data["target-state"] = me.options.targetState;
      }
      if (!url) {
        return dfd.reject();
      }
      $.ajax(connector.extendAjaxOptions({
        url: Url.appendQuery(url, Url.combineQueryString(queryParam)),
        type: "POST",
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        data: JSON.stringify(data),
        success: function(response) {
          var validAndErrorDocuments = me._getValidAndErrorDocuments(me.options.nodeModels, response);
          dfd.resolve(validAndErrorDocuments.errorDocuments, validAndErrorDocuments.validDocuments);
        },
        error: function(err) {
          dfd.reject(err);
        }
      }));
      return dfd.promise();
    }
  });
  return LifecycleValidationDialog;
});