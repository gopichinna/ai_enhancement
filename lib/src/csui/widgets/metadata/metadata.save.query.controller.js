/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/models/nodes", "csui/models/node/node.model", "csui/widgets/metadata/impl/metadata.utils", "csui/utils/commands/add.item.metadata", "i18n!csui/utils/commands/nls/localized.strings" ], function(_, $, Backbone, NodeCollection, NodeModel, MetadataUtils, AddItemMetadataCommand, lang) {
  "use strict";
  function MetadataSaveQueryController() {}
  _.extend(MetadataSaveQueryController.prototype, Backbone.Events, {
    _checkForRequiredMetadata: function(model, status) {
      var context = status.context, containderId = model.get("parent_id"), deferredObject = $.Deferred(), utilOptions = {
        name: model.get("name"),
        docParentId: model.get("parent_id"),
        addableType: model.get("type"),
        action: "create",
        container: new NodeModel({
          id: containderId
        }, {
          connector: status.connector
        })
      };
      var metadataUtils = new MetadataUtils();
      metadataUtils.ContainerHasEnforcedEmptyRequiredMetadata(utilOptions).done(_.bind(function(resp) {
        if (resp.hasRequiredMetadata === true) {
          var nodes = new NodeCollection();
          nodes.push(model);
          var addItemStatus = {
            nodes: nodes,
            container: new NodeModel({
              id: containderId
            }, {
              connector: status.connector
            })
          }, options = {
            context: context,
            addableType: model.get("type"),
            callerProcessData: true,
            addButtonTitle: lang.saveButtonLabel,
            dialogTitle: lang.DialogTitleSaveQuery
          };
          var addItemMetadataCmd = new AddItemMetadataCommand();
          addItemMetadataCmd.execute(addItemStatus, options).then(function(resp) {
            deferredObject.resolve(resp);
          }).fail(function(err) {
            deferredObject.reject();
          });
        } else {
          deferredObject.resolve();
        }
      })).fail(function() {
        deferredObject.reject();
      });
      return deferredObject.promise();
    }
  });
  MetadataSaveQueryController.prototype.get = Backbone.Model.prototype.get;
  _.extend(MetadataSaveQueryController, {
    version: "1.0"
  });
  return MetadataSaveQueryController;
});