/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/utils/base", "csui/lib/jquery", "csui/utils/log", "csui/utils/url", "i18n!csui/utils/commands/nls/localized.strings", "csui/models/command", "csui/utils/commandhelper", "csui/utils/commands/multiple.items", "csui/utils/commands/compound.document/compound.document.util" ], function(module, require, _, base, $, log, Url, lang, CommandModel, CommandHelper, MultipleItemsCommand, CompoundDocumentsUtil) {
  "use strict";
  var GlobalMessage, ConflictResolver, ApplyPropertiesSelectorView, UploadFileCollection, PageLeavingBlocker, nodeLinks, actionType, ApplicationScope;
  var CommandParent = CommandModel.extend({
    constructor: function(options) {
      CommandModel.prototype.constructor.call(this, options);
    }
  });
  _.extend(CommandParent.prototype, MultipleItemsCommand);
  var CopyMoveCommand = CommandParent.extend({
    execute: function(status, options) {
      var self = this;
      var deferred = $.Deferred();
      var context = status.context || options && options.context;
      var labels = self.get("labels");
      actionType = self.get("command");
      status.suppressSuccessMessage = true;
      status.suppressFailMessage = true;
      require([ "csui/controls/globalmessage/globalmessage", "csui/controls/conflict.resolver/conflict.resolver", "csui/dialogs/node.picker/impl/header/apply.properties.selector/apply.properties.selector.view", "csui/models/fileuploads", "csui/utils/page.leaving.blocker", "csui/utils/node.links/node.links", "csui/utils/contexts/factories/application.scope.factory" ], function() {
        GlobalMessage = arguments[0];
        ConflictResolver = arguments[1];
        ApplyPropertiesSelectorView = arguments[2];
        UploadFileCollection = arguments[3];
        PageLeavingBlocker = arguments[4];
        nodeLinks = arguments[5];
        ApplicationScope = arguments[6];
        if (GlobalMessage.isActionInProgress(actionType, labels.titleNotAllowed, labels.commandTitle)) {
          return deferred.resolve();
        }
        self._selectActionOptions(status, options, labels).done(function(selectedOptions) {
          var selectedNodes = status.nodes;
          var targetFolder = selectedOptions.nodes[0];
          var applyProperties = selectedOptions.applyProperties;
          var bundleNumber = new Date().getTime();
          var copyToCurrentFolder = status.container ? targetFolder.get("id") === status.container.get("id") : false;
          self._announceOperationStart(status);
          var namesToResolve = selectedNodes.map(function(node) {
            var returnObj = {
              id: node.get("id"),
              name: node.get("name"),
              container: node.get("container"),
              mime_type: node.get("mime_type"),
              original_id: node.get("original_id"),
              original: node.original,
              type: node.get("type"),
              size: node.get("size"),
              type_name: node.get("type_name"),
              state: "pending",
              count: 0,
              total: 1,
              enableCancel: false,
              bundleNumber: bundleNumber
            };
            var type = node.get("type");
            if (type === 144 || type === 749 || type === 736 || type === 30309) {
              returnObj.size_formatted = node.get("size_formatted");
            } else if (type === 140) {
              returnObj.url = node.get("url");
            }
            returnObj.actions = node.actions;
            returnObj.targetLocation = {
              id: targetFolder.get("id"),
              url: nodeLinks.getUrl(targetFolder)
            };
            var mlDataEnabled = base.getMetadataLanguageInfo().enabled;
            if (mlDataEnabled) {
              returnObj.multilingual_provided = true, !!node.has("name_multilingual") && (returnObj.name_multilingual = node.get("name_multilingual"));
              !!node.has("description_multilingual") && (returnObj.description_multilingual = node.get("description_multilingual"));
            }
            return returnObj;
          });
          var actionNamesToResolve = _.map(namesToResolve, function(name) {
            return _.clone(name);
          });
          self._resolveNamingConflicts(targetFolder, actionNamesToResolve, labels, selectedNodes).done(function(actionInstructions) {
            _.each(actionInstructions, function(instruction) {
              if (instruction.id === undefined) {
                instruction.id = _.findWhere(namesToResolve, {
                  name: instruction.name
                }).id;
              }
            });
            self._metadataHandling(actionInstructions, labels, _.extend(selectedOptions, {
              context: context,
              targetFolder: targetFolder
            })).done(function() {
              var uploadCollection = new UploadFileCollection(actionInstructions, {
                container: targetFolder ? targetFolder.clone() : undefined
              });
              function updateUploadCollection(collectionModel) {
                if (labels.commandName === lang.CommandNameMove) {
                  collectionModel.each(function(model) {
                    model.node = selectedNodes.findWhere({
                      id: model.get("id")
                    });
                  });
                } else {
                  collectionModel.each(function(model) {
                    var sourceNode = selectedNodes.findWhere({
                      id: model.get("id")
                    });
                    model.node.set(_.omit(sourceNode.attributes, "id"));
                  });
                }
              }
              updateUploadCollection(uploadCollection);
              var connector = status.container && status.container.connector;
              if (connector === undefined) {
                var aNode = CommandHelper.getAtLeastOneNode(status).first();
                aNode && (connector = aNode.connector);
              }
              self._getOrderNextValue(targetFolder, connector).always(function() {
                var applicationScope = status.originatingView && status.originatingView.context && status.originatingView.context.getModel(ApplicationScope);
                var opts = {
                  uploadCollection: uploadCollection,
                  connector: connector,
                  targetFolder: targetFolder,
                  applyProperties: applyProperties,
                  status: status,
                  context: context,
                  copyToCurrentFolder: copyToCurrentFolder,
                  collection: status.collection,
                  applicationScopeId: applicationScope && applicationScope.id
                };
                self._doActionSelectedNodes(opts).always(function(uploadModels) {
                  const uploadModelFilter = uploadModels.filter(uploadModel => {
                    if (!uploadModel.statusCode) {
                      return uploadModel;
                    }
                  });
                  let newUploadCollection = new UploadFileCollection(uploadModelFilter, {
                    container: targetFolder ? targetFolder.clone() : undefined
                  });
                  updateUploadCollection(newUploadCollection);
                  opts.uploadCollection = newUploadCollection;
                  deferred.resolve(self._doPostExecute(opts));
                  self._announceOperationEnd(status);
                  labels.commandName === lang.CommandNameMove && opts.context.trigger("current:folder:changed");
                }).fail(function() {
                  deferred.reject();
                });
              });
            }).fail(function() {
              self._announceOperationEnd(status);
              deferred.reject();
            });
          }).fail(function(error) {
            if (error && error.userAction && error.userAction === "cancelResolveNamingConflicts") {
              self.trigger("resolve:naming:conflicts:cancelled");
            } else if (error && !error.cancelled) {
              self.showError(error);
            }
            self._announceOperationEnd(status);
            deferred.reject();
          });
        }).fail(function(error) {
          if (error && !error.cancelled) {
            self.showError(error);
          }
          deferred.reject();
        });
      }, deferred.reject);
      return deferred.promise();
    },
    _announceOperationStart: function(status) {
      var originatingView = status.originatingView;
      if (originatingView.blockActions) {
        originatingView.blockActions();
      }
      PageLeavingBlocker.enable(this.get("pageLeavingWarning"));
    },
    _announceOperationEnd: function(status) {
      PageLeavingBlocker.disable();
      this._unblockPageActions(status);
    },
    _unblockPageActions: function(status) {
      var originatingView = status.originatingView;
      originatingView.unblockActions && originatingView.unblockActions();
    },
    _selectActionOptions: function(status, options, labels) {
      var self = this;
      var deferred = $.Deferred();
      require([ "csui/dialogs/node.picker/node.picker" ], function(NodePicker) {
        var contextMenuCopy = status.container ? status.container.get("id") === status.nodes.models[0].get("id") : false;
        var numNodes = status.nodes.length;
        var dialogTitle = _.str.sformat(numNodes > 1 ? labels.dialogTitle : labels.dialogTitleSingle, numNodes);
        var pickerOptions = _.extend({
          command: actionType,
          selectableTypes: [ -1 ],
          unselectableTypes: [ 899 ],
          addableTypes: [ 0 ],
          showAllTypes: true,
          orderBy: "type asc",
          dialogTitle: dialogTitle,
          initialContainer: status.container || status.nodes.models[0].parent,
          initialSelection: status.nodes,
          startLocation: contextMenuCopy ? "recent.containers" : "",
          includeCombineProperties: numNodes === 1,
          propertiesSeletor: true,
          globalSearch: true,
          disableSearchFromHere: true,
          context: options ? options.context : status.context,
          startLocations: [ "enterprise.volume", "current.location", "personal.volume", "favorites", "recent.containers" ],
          resolveShortcuts: true,
          resultOriginalNode: true,
          includeResources: [ "show_hidden" ],
          showTargetLocationName: true,
          isKeyEvent: status?.toolItem?.get("isKeyEvent")
        }, status);
        self.nodePicker = new NodePicker(pickerOptions);
        self.originatingView = status.originatingView;
        self.nodePicker.show().done(function() {
          deferred.resolve.apply(deferred, arguments);
        }).fail(function() {
          deferred.reject.apply(deferred, arguments);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _resolveNamingConflicts: function(targetFolder, nodeNames, labels, selectedNodes) {
      var h1 = nodeNames.length === 1 ? labels.actionNode : _.str.sformat(labels.actionName, nodeNames.length);
      var conflictResolver = new ConflictResolver({
        h1Label: h1,
        actionBtnLabel: labels.commandName,
        excludeAddVersion: true,
        container: targetFolder,
        files: nodeNames,
        originatingView: this.originatingView,
        selectedNodes: selectedNodes
      });
      return conflictResolver.run();
    },
    _metadataHandling: function(items, labels, options) {
      var deferred = $.Deferred();
      this.originatingView && this.originatingView._blockingCounter === 0 && this.originatingView.blockActions();
      require([ "csui/widgets/metadata/metadata.copy.move.items.controller" ], function(MetadataCopyMoveItemsController) {
        var openMetadata = options.openSelectedProperties;
        var applyProperties = options.applyProperties;
        var metadataController = new MetadataCopyMoveItemsController();
        var controllerFunction;
        if (openMetadata) {
          controllerFunction = metadataController.CopyMoveItemsWithMetadata;
        } else if (applyProperties === ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES || applyProperties === ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES) {
          controllerFunction = metadataController.CopyMoveItemsRequiredMetadata;
        } else {
          return deferred.resolve();
        }
        if (applyProperties === ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES) {
          options.inheritance = "original";
        } else if (applyProperties === ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES) {
          options.inheritance = "destination";
        } else if (applyProperties === ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES) {
          options.inheritance = "merged";
        }
        options.action = actionType;
        controllerFunction.call(metadataController, items, options).done(function() {
          deferred.resolve();
        }).fail(function(error) {
          deferred.reject(error);
        });
      }, function(error) {
        log.warn("Failed to load MetadataCopyMoveItemsController. {0}", error) && console.warn(log.last);
        deferred.reject(error);
      });
      return deferred.promise();
    },
    _addToCurrentTable: function(node, targetCollection) {
      node.isLocallyCreated = true;
      node.fetch({
        collection: targetCollection
      }).then(function() {
        targetCollection.unshift(node);
      });
    },
    checkMultilingualInfo: function(instruction, params) {
      if (!!instruction.multilingual_provided) {
        _.extend(params, {
          name_multilingual: instruction.name_multilingual
        });
        instruction.description_multilingual && _.extend(params, {
          description_multilingual: instruction.description_multilingual
        });
      }
    },
    _getOrderNextValue: function(targetFolder) {
      var deferred = $.Deferred();
      if (targetFolder && targetFolder.get("type") === 136 && !targetFolder.get("fileOrder")) {
        CompoundDocumentsUtil.getOrderNextValue(targetFolder).always(function() {
          deferred.resolve();
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }
  });
  return CopyMoveCommand;
});