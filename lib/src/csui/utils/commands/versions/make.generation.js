/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui/lib/jquery", "i18n!csui/utils/commands/versions/nls/localized.strings", "csui/utils/commandhelper", "csui/models/command", "csui/utils/base", "csui/utils/url" ], function(_, $, versionLang, CommandHelper, Command, base, Url) {
  "use strict";
  var ConflictResolver, UploadFileCollection, GlobalMessage, NodeLinks, NextNodeModelFactory;
  var MakeGenerationCommand = Command.extend({
    defaults: {
      signature: "VersionMakeGeneration",
      command_key: [ "makegeneration" ],
      name: versionLang.CommandNameMakeGeneration,
      verb: versionLang.CommandVerbMakeGeneration,
      scope: "single"
    },
    enabled: function(status, options) {
      if (status.nodes.length !== 1) {
        return false;
      }
      var version = CommandHelper.getJustOneNode(status);
      return this._isActionAvalableInNode(version);
    },
    _isActionAvalableInNode: function(node) {
      if (!node || !node.actions) {
        return false;
      }
      var makeGenerationAction = node.actions.findWhere(function(action) {
        return action.id === "makegeneration";
      });
      return makeGenerationAction !== undefined;
    },
    execute: function(status, options) {
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      var deferred = $.Deferred();
      require([ "csui/controls/globalmessage/globalmessage", "csui/controls/conflict.resolver/conflict.resolver", "csui/models/fileuploads", "csui/utils/node.links/node.links", "csui/utils/contexts/factories/next.node" ], _.bind(function() {
        GlobalMessage = arguments[0];
        ConflictResolver = arguments[1];
        UploadFileCollection = arguments[2];
        NodeLinks = arguments[3];
        NextNodeModelFactory = arguments[4];
        var currentNode = status.container;
        status.version = CommandHelper.getJustOneNode(status);
        this._selectTargetLocation(status, options).done(_.bind(function(selectedOptionInfo) {
          _.extend(status, {
            updatedName: selectedOptionInfo.filterName,
            targetContainer: selectedOptionInfo.nodes[0],
            connector: currentNode ? currentNode.connector : selectedOptionInfo.nodes[0].connector
          });
          var uploadCollection = this._addToUploadCollection(status);
          this._resolveNamingConflicts(uploadCollection, status).done(_.bind(function(resolvedItemsCollection) {
            resolvedItemsCollection.forEach(function(resolvedItem) {
              resolvedItem.set({
                type: 2
              }, {
                silent: true
              });
            });
            this._handleRequiredMetadata(resolvedItemsCollection, status).done(_.bind(function(ItemsCollection) {
              this._createGeneration(ItemsCollection, status).done(_.bind(function(res) {
                this._removeDeleteAction(status.version);
                deferred.resolve(res);
              }, this)).fail(function(error) {
                deferred.reject(error);
              });
            }, this)).fail(function(error) {
              deferred.reject(error);
            });
          }, this)).fail(function(error) {
            deferred.reject(error);
          });
        }, this)).fail(function(error) {
          deferred.reject(error);
        });
      }, this), function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _selectTargetLocation: function(status, options) {
      var deferred = $.Deferred();
      require([ "csui/dialogs/node.picker/node.picker" ], _.bind(function(NodePicker) {
        var dialogTitle = versionLang.NameAsMakeGeneration, initialContainer = this._getParentContainer(status);
        var pickerOptions = _.extend({
          selectableTypes: [ -1 ],
          unselectableTypes: [ 899, 298 ],
          addableTypes: [ 0 ],
          showAllTypes: true,
          orderBy: "type asc",
          saveFilter: true,
          initialFilter: status.version.get("name"),
          dialogTitle: dialogTitle,
          initialContainer: initialContainer,
          initialSelection: status.nodes,
          startLocation: !initialContainer ? "recent.containers" : "",
          globalSearch: true,
          disableSearchFromHere: true,
          context: options ? options.context : status.context,
          startLocations: [ "enterprise.volume", "current.location", "personal.volume", "favorites", "recent.containers" ],
          resolveShortcuts: true,
          resultOriginalNode: true,
          includeResources: [ "show_hidden" ],
          isKeyEvent: status?.toolItem?.get("isKeyEvent")
        }, status);
        this.nodePicker = new NodePicker(pickerOptions);
        this.originatingView = status.originatingView;
        this.nodePicker.show().done(function() {
          deferred.resolve.apply(deferred, arguments);
        }).fail(function() {
          deferred.reject.apply(deferred, arguments);
        });
      }, this), function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _getParentContainer: function(status) {
      var parentId;
      if (status.container) {
        parentId = status.container.get("parent_id");
      } else {
        parentId = status.version.get("id_expand") && status.version.get("id_expand").parent_id;
      }
      return parentId ? {
        id: parentId
      } : null;
    },
    _addToUploadCollection: function(options) {
      var uploadCollection = new UploadFileCollection();
      uploadCollection.add({
        file: {
          name: options.updatedName || options.version.get("name"),
          type: options.version.get("mime_type"),
          size: 1
        },
        name: options.updatedName || options.version.get("name"),
        container: options.targetContainer,
        original_id: options.version.get("id"),
        parent_id: options.targetContainer.get("id"),
        version_number: options.version.get("version_number"),
        type: 2,
        type_name: "Generation",
        targetLocation: {
          id: options.targetContainer.get("id"),
          url: NodeLinks.getUrl(options.targetContainer)
        }
      }, {
        container: options.targetContainer,
        connector: options.connector,
        enforcedRequiredAttrs: true
      });
      return uploadCollection;
    },
    _resolveNamingConflicts: function(items, options) {
      var conflictResolver = new ConflictResolver({
        h1Label: versionLang.ActionNameMakeGeneration,
        actionBtnLabel: versionLang.ActionTitleMakeGeneration,
        excludeAddVersion: true,
        container: options.targetContainer,
        files: items,
        originatingView: options.originatingView
      });
      return conflictResolver.run();
    },
    _handleRequiredMetadata: function(itemsCollection, options) {
      var deferred = $.Deferred();
      options.originatingView && options.originatingView._blockingCounter === 0 && options.originatingView.blockActions();
      require([ "csui/widgets/metadata/impl/add.items/metadata.add.item.controller" ], function(MetadataAddItemController) {
        var currentModel = itemsCollection.first();
        var metadataController = new MetadataAddItemController();
        metadataController.addItemsRequiredMetadata(itemsCollection.models, {
          container: options && options.targetContainer,
          context: options.context,
          openMetadata: options.openMetadata,
          inheritance: options.inheritance,
          addableType: options.addableType || 2,
          dialogTitle: versionLang.ActionNameMakeGeneration,
          addButtonTitle: versionLang.ActionTitleMakeGeneration,
          data: {
            original_id: currentModel.get("original_id"),
            version_number: currentModel.get("version_number")
          }
        }).done(function() {
          deferred.resolve(itemsCollection);
        }).fail(function() {
          deferred.reject();
        }).always(function() {
          options.originatingView && options.originatingView.unblockActions();
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _createGeneration: function(itemsCollection, options) {
      var currentModel = itemsCollection.first(), name = currentModel.get("newName") || currentModel.get("name"), versionNumber = currentModel.get("version_number"), originalId = currentModel.get("original_id"), parentId = currentModel.get("parent_id"), extendedData = currentModel.get("extended_data"), deferred = $.Deferred();
      var data = {
        name: name,
        type: 2,
        version_number: versionNumber,
        original_id: originalId,
        parent_id: parentId
      };
      var mlDataEnabled = base.getMetadataLanguageInfo().enabled;
      if (mlDataEnabled && !!currentModel.get("multilingual_provided")) {
        _.extend(data, {
          name_multilingual: currentModel.get("name_multilingual")
        });
      }
      if (extendedData) {
        _.deepExtend(data, extendedData);
      }
      var makegenerationOptions = {
        url: Url.combine(options.connector.getConnectionUrl().getApiBase("v1"), "/nodes"),
        method: "POST",
        data: data,
        contentType: options.connector.getAjaxContentType()
      };
      options.connector.makeAjaxCall(makegenerationOptions).done(function(model) {
        currentModel.set("count", 1);
        currentModel.node = null;
        currentModel.deferred.resolve(currentModel);
        deferred.resolve(model);
      }).fail(function(error) {
        currentModel.deferred.reject(currentModel, {
          message: error.responseText
        });
        deferred.reject(error);
      });
      GlobalMessage.showProgressPanel(itemsCollection, {
        oneFileTitle: versionLang.ActionNameMakeGeneration,
        oneFileSuccess: versionLang.MessageSuccessMakeGeneration,
        oneFilePending: versionLang.ActionNameMakeGeneration,
        oneFileFailure: versionLang.MessageFailureMakeGeneration,
        enableCancel: false,
        context: options.context,
        nextNodeModelFactory: NextNodeModelFactory
      });
      return deferred.promise();
    },
    _removeDeleteAction: function(version) {
      if (!version || !version.actions || version.actions.length === 0) {
        return;
      }
      version.set("has_generation", true);
      var actionCollection = version.actions, updatedActions = actionCollection.filter(function(action) {
        return !(action.id === "delete" || action.id === "versions_delete");
      });
      if (updatedActions.length < actionCollection.length) {
        actionCollection.reset(updatedActions);
      }
    }
  });
  return MakeGenerationCommand;
});