/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/models/node/node.model", "d2/commands/paste", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/utils", "i18n!d2/commands/nls/localized.strings" ], function($, NodeModel, PasteCommand, constants, RestLinkrels, utils, lang) {
  "use strict";
  return PasteCommand.extend({
    defaults: {
      signature: "D2-PasteAsLink",
      command_key: "D2-PasteAsLink",
      name: lang.CommandNamePasteAsLink,
      pageLeavingWarning: lang.PastePageLeavingWarning,
      scope: "single"
    },
    execute: function(status, options) {
      options = options || {};
      options.skipSingleRepoPaste = true;
      return PasteCommand.prototype.execute.call(this, status, options);
    },
    doAction: function(node, options) {
      var me = this, deferred = $.Deferred(), container = options.container;
      $.ajax(container.connector.extendAjaxOptions({
        url: RestLinkrels.getLink(container.get("links"), RestLinkrels.CHILD_LINKS),
        type: "POST",
        data: JSON.stringify({
          href: RestLinkrels.getLink(node.get("links"), RestLinkrels.SELF)
        }),
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          var newNode = new NodeModel({
            id: response["child-id"]
          }, {
            connector: container.connector
          });
          me._refreshNode(newNode, options).done(function() {
            options.newNodesArr.push(newNode);
            deferred.resolve(newNode);
          });
        },
        error: function(xhr, textStatus, errorThrown) {
          var errMessage = utils.parseAjaxErrorAsString(xhr, textStatus, errorThrown, true);
          deferred.reject(errMessage);
        }
      }));
      return deferred.promise();
    },
    handleResults: function(results, options) {
      return PasteCommand.prototype.handleResults.call(this, results, options, false);
    },
    getMessageOptions: function() {
      return {
        oneFileSuccess: lang.PasteAsLinkOneItemSuccessMessage,
        multiFileSuccess: lang.PasteAsLinkManyItemsSuccessMessage,
        oneFilePending: lang.PastingOneItem,
        multiFilePending: lang.PastingManyItems,
        oneFileFailure: lang.PasteAsLinkOneItemFailMessage,
        multiFileFailure: lang.PasteAsLinkManyItemsFailMessage,
        multiFileOneFailure: lang.PasteAsLinkManyItemsOneFailMessage,
        someItemsStopped: lang.PasteStopped,
        actionType: "PASTE_AS_LINK"
      };
    }
  });
});