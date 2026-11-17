/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/jquery", "csui/lib/underscore", "csui/utils/log", "csui/models/command", "csui/models/node/node.model", "csui/utils/commands/add/add.mixin", "csui/utils/node.links/node.links", "i18n!csui/utils/commands/nls/localized.strings" ], function(module, require, $, _, log, CommandModel, NodeModel, AddMixin, NodeLinks, lang) {
  "use strict";
  var config = module.config(), supportTypes = [ 0, 1, 136, 140, 144, 298, 1307, 1308, 800, 801 ], noFormTypes = [ 144, 801, 1307 ], extSignatures = [], extSupportTypes = config.extSupportTypes || {}, extNoFormTypes = config.extNoFormTypes || {}, extAddCommandsSignatures = config.extAddCommandSignatures || {};
  supportTypes = Array.prototype.concat.apply(supportTypes, _.values(extSupportTypes));
  noFormTypes = Array.prototype.concat.apply(noFormTypes, _.values(extNoFormTypes));
  extSignatures = Array.prototype.concat.apply(extSignatures, _.values(extAddCommandsSignatures));
  let uploadFileCollection;
  var AddCommand = CommandModel.extend({
    defaults: {
      signature: "Add"
    },
    enabled: function(status) {
      status || (status = {});
      if (status.container && status.container.get("container")) {
        if (status.container.get("type") === 298) {
          return false;
        }
        status.data || (status.data = {});
        var addableTypes = status.data.addableTypes;
        return addableTypes && _.any(supportTypes, function(type) {
          return !!addableTypes.get(type);
        });
      }
      return false;
    },
    execute: function(status, options) {
      if (options && options.addableType === undefined) {
        throw new Error("Missing options.addableType");
      }
      var newNode, promise, addableTypeName = this._getAddableTypeName(status, options);
      switch (options.addableType) {
       case 0:
       case 298:
       case 1308:
       case 800:
       case 136:
        status.forwardToTable = true;
        newNode = new NodeModel({
          type: options.addableType,
          type_name: addableTypeName,
          container: true,
          name: ""
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;

       case 140:
        status.forwardToTable = true;
        newNode = new NodeModel({
          type: options.addableType,
          type_name: addableTypeName,
          container: false,
          name: ""
        }, {
          connector: status.container.connector,
          collection: status.collection
        });
        promise = $.Deferred().resolve(newNode).promise();
        break;

       case 1:
        status.forwardToTable = true;
        promise = this._selectShortcutTarget(status, options);
        break;

       case 144:
       case 1307:
       case 801:
        status.suppressSuccessMessage = true;
        options.actionType = "UPLOAD";
        promise = this._selectFilesForUpload(status, options);
        break;

       default:
        promise = this._executeExtCommands(status, options);
      }
      return promise;
    },
    _executeExtCommands: function(status, options) {
      var def = $.Deferred(), self = this;
      require([ "csui/utils/commands" ], function(commands) {
        for (var i = 0; i < extSignatures.length; i++) {
          var command = commands.get(extSignatures[i]);
          if (command.supportTypes && _.indexOf(command.supportTypes, options.addableType) > -1) {
            command.execute(status, options).done(def.resolve).fail(def.reject);
            break;
          }
        }
        if (i === extSignatures.length) {
          self.noAddCommandMessage(options).fail(def.reject);
        }
      });
      return def.promise();
    },
    noAddCommandMessage: function(options) {
      var errMsg = 'The "Add" action for the addableType ' + options.addableType + " is not implemented";
      log.debug(errMsg) && console.log(log.last);
      return $.Deferred().reject({
        error: errMsg,
        commandSignature: this.signature
      }).promise();
    },
    _selectShortcutTarget: function(status, options) {
      var self = this, deferred = $.Deferred();
      require([ "csui/dialogs/node.picker/node.picker", "csui/models/fileuploads" ], function(NodePicker, FileUploadCollection) {
        uploadFileCollection = FileUploadCollection;
        var pickerOptions = {
          dialogTitle: lang.ShortcutPickerTitle,
          connector: status.container.connector,
          context: options.context,
          initialContainer: status.container,
          globalSearch: true,
          startLocation: "recent.containers",
          startLocations: [ "enterprise.volume", "current.location", "personal.volume", "favorites", "recent.containers" ],
          unselectableTypes: [ 141, 142, 133 ],
          resolveShortcuts: true,
          resultOriginalNode: true
        };
        self.nodePicker = new NodePicker(pickerOptions);
        return self.nodePicker.show().then(function(args) {
          const currentNode = status.container;
          status.currentNode = args.nodes[0];
          Object.assign(status, {
            updatedName: args.filterName,
            targetContainer: args.nodes[0],
            connector: currentNode ? currentNode.connector : args.nodes[0].connector
          });
          const uploadCollection = _addToUploadCollection(status);
          return _handleRequiredMetadata(uploadCollection, status).then(function(itemsCollection) {
            const currentModel = itemsCollection.first();
            const name = currentModel.get("newName") ?? currentModel.get("name");
            const originalId = currentModel.get("original_id");
            const parentId = currentModel.get("parent_id");
            const extendedData = currentModel.get("extended_data");
            const data = {
              name: name,
              type: 1,
              original_id: originalId,
              parent_id: parentId
            };
            if (extendedData) {
              _.deepExtend(data, extendedData);
            }
            var newNode = new NodeModel(data, {
              connector: status.container.connector,
              collection: status.collection
            });
            return newNode;
          });
        }).done(function() {
          deferred.resolve.apply(deferred, arguments);
        }).fail(function() {
          deferred.reject.apply(deferred, arguments);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
      function _addToUploadCollection(options) {
        const uploadCollection = new uploadFileCollection();
        uploadCollection.add({
          file: {
            name: options.updatedName ?? options.currentNode.get("name"),
            type: options.currentNode.get("mime_type"),
            size: 1
          },
          name: options.updatedName ?? options.currentNode.get("name"),
          container: options.container,
          original_id: options.currentNode.get("id"),
          parent_id: options.container.get("id"),
          type: 1,
          type_name: "Shortut",
          targetLocation: {
            id: options.container.get("id"),
            url: NodeLinks.getUrl(options.container)
          }
        }, {
          container: options.container,
          connector: options.connector,
          enforcedRequiredAttrs: true
        });
        return uploadCollection;
      }
      function _handleRequiredMetadata(itemsCollection, options) {
        const metadataDeferred = $.Deferred();
        options.originatingView && options.originatingView._blockingCounter === 0 && options.originatingView.blockActions();
        require([ "csui/widgets/metadata/impl/add.items/metadata.add.item.controller" ], function(MetadataAddItemController) {
          const currentModel = itemsCollection.first();
          const metadataController = new MetadataAddItemController();
          metadataController.addItemsRequiredMetadata(itemsCollection.models, {
            container: options.currentNode || currentModel,
            context: options.context,
            openMetadata: options.openMetadata,
            inheritance: options.inheritance,
            addableType: options.addableType || 1,
            dialogTitle: lang.ActionNameMakeShortcut,
            addButtonTitle: lang.ActionTitleMakeShortcut,
            data: {
              original_id: currentModel.get("original_id")
            }
          }).done(function() {
            metadataDeferred.resolve(itemsCollection);
          }).fail(function() {
            metadataDeferred.reject();
          }).always(function() {
            options.originatingView && options.originatingView.unblockActions();
          });
        });
        return metadataDeferred.promise();
      }
    }
  }, {
    isAddableTypeWithoutInlineForm: function(addableType) {
      return noFormTypes.indexOf(addableType) !== -1;
    }
  });
  AddMixin.mixin(AddCommand.prototype);
  return AddCommand;
});