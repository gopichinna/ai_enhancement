/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "csui/utils/commandhelper", "d2/commands/node.progress.command", "d2/models/virtual.document.children", "d2/utils/vdoc.utils", "d2/utils/vdoc.creation.utils", "i18n!d2/commands/nls/localized.strings" ], function(_, $, Backbone, CommandHelper, NodeProgressCommand, VirtualDocumentChildren, vdocUtils, vdocCreationUtils, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-ConvertToVDoc",
      command_key: "D2-ConvertToVDoc",
      name: lang.CommandNameConvertToVDoc,
      scope: "multiple"
    },
    doAction: function(node) {
      var deferred = $.Deferred();
      vdocCreationUtils.convertToVDoc(node, this.get("signature"), undefined).done(function() {
        deferred.resolve(node);
      }).fail(function(error) {
        deferred.reject(error.responseJSON ? error.responseJSON.details : error.message ? error.message : error);
      });
      return deferred.promise();
    },
    handleResults: function(results, options) {
      if (options.collection instanceof VirtualDocumentChildren) {
        var parentVdmList = _.uniq(_.compact(_.map(results, function(node) {
          if (node instanceof Backbone.Model) {
            return vdocUtils.getParentVDMNumber(node);
          }
        })));
        return options.collection.refresh({
          vdmNumber: parentVdmList
        });
      } else {
        var widgetConfig = {};
        if (options.collection && options.collection.options) {
          widgetConfig.widgetType = options.collection.widgetType;
          widgetConfig.widgetName = options.collection.options.widgetName;
          widgetConfig.isDisableLocationColumn = options.collection.options.isDisableLocationColumn;
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
        oneFilePending: lang.ConvertingToVDOneItem,
        multiFilePending: lang.ConvertingToVDManyItems,
        oneFileSuccess: lang.ConvertToVDOneItemSuccessMessage,
        multiFileSuccess: lang.ConvertToVDManyItemsSuccessMessage,
        oneFileFailure: lang.ConvertToVDOneItemFailMessage,
        multiFileOneFailure: lang.ConvertingToVDManyItemsOneFailMessage,
        multiFileFailure: lang.ConvertingToVDManyItemsFailMessage,
        someItemsStopped: lang.ConvertToVDStopped,
        actionType: "CONVERTVD"
      };
    }
  });
});