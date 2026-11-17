/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "d2/commands/node.progress.command", "d2/models/virtual.document.children", "d2/utils/rest.linkrels", "d2/utils/vdoc.utils", "d2/utils/constants", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, CommandHelper, NodeProgressCommand, VirtualDocumentChildren, RestLinkrels, vdocUtils, constants, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-ConvertToSimpleDoc",
      command_key: "D2-ConvertToSimpleDoc",
      name: lang.CommandNameConvertToSimpleDoc,
      scope: "multiple"
    },
    enabled: function(status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var invalid = nodes.any(function(node) {
        return vdocUtils.hasVDChildren(node) || !vdocUtils.isVirtualDoc(node);
      });
      if (invalid) {
        return false;
      }
      return NodeProgressCommand.prototype.enabled.call(this, status, options);
    },
    doAction: function(node) {
      var deferred = $.Deferred(), url = CommandHelper.getOriginalActionLink(node, this.get("signature"), RestLinkrels.D2_CONVERT_TO_SIMPLE_DOC);
      if (!url) {
        deferred.reject(new Error(lang.ConvertToSimpleDocumentLinkRelMissing));
      } else {
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          type: "DELETE",
          headers: {
            Accept: constants.MediaTypes.DCTM_JSON,
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function() {
            deferred.resolve(node);
          },
          error: deferred.reject
        }));
      }
      return deferred.promise();
    },
    handleResults: function(results, options) {
      var collection = options.collection, nodes = CommandHelper.getAtLeastOneNode(options);
      if (collection instanceof VirtualDocumentChildren) {
        if (collection.length === 1) {
          options.originatingView.trigger("navigate:to:container:parent");
          return $.Deferred().resolve().promise();
        } else {
          var parentVdmList = _.uniq(_.map(nodes.models, function(node) {
            return vdocUtils.getParentVDMNumber(node);
          }));
          return collection.refresh({
            vdmNumber: parentVdmList
          });
        }
      } else {
        var widgetConfig = {};
        if (collection && collection.options) {
          widgetConfig.widgetType = collection.widgetType;
          widgetConfig.widgetName = collection.options.widgetName;
          widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
        }
        var promises = _.compact(_.map(results, function(node) {
          if (node instanceof Backbone.Model) {
            return CommandHelper.refreshNode(node, widgetConfig);
          }
        }));
        return $.whenAll.apply($, promises);
      }
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.ConvertingToSimpleDocumentOneItem,
        multiFilePending: lang.ConvertingToSimpleDocumentManyItems,
        oneFileSuccess: lang.ConvertToSimpleDocumentOneItemSuccessMessage,
        multiFileSuccess: lang.ConvertToSimpleDocumentManyItemsSuccessMessage,
        oneFileFailure: lang.ConvertToSimpleDocumentOneItemFailMessage,
        multiFileOneFailure: lang.ConvertingToSimpleDocumentManyItemsOneFailMessage,
        multiFileFailure: lang.ConvertingToSimpleDocumentManyItemsFailMessage,
        someItemsStopped: lang.ConvertToSimpleDocumentStopped,
        actionType: "CONVERTSIMPLEDOC"
      };
    }
  });
});