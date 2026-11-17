/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "d2/controls/globalmessage/globalmessage", "nuc/models/node/node.model", "nuc/models/nodes", "csui/utils/commandhelper", "csui/utils/command.error", "nuc/utils/url", "d2/commands/node.progress.command", "d2/utils/clipboard.manager", "d2/utils/constants", "d2/utils/rest.linkrels", "dctmw/utils/rest.resources", "dctmw/utils/utils", "d2/utils/creation.utils", "i18n!d2/commands/nls/localized.strings" ], function(require, $, _, Backbone, GlobalMessage, NodeModel, NodeCollection, CommandHelper, CommandError, Url, NodeProgressCommand, ClipboardManager, constants, RestLinkrels, RestResources, utils, CreationUtils, lang) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-Paste",
      command_key: "D2-Paste",
      name: lang.CommandNamePaste,
      pageLeavingWarning: lang.PastePageLeavingWarning,
      scope: "single"
    },
    execute: function(status, options) {
      options = options || {};
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      options.newNodesArr = [];
      var operation = ClipboardManager.getOperation(), clipboardData = ClipboardManager.getStoredItems(), ignoretypes = [ constants.Types.FOLDER ], ignorableTypes = _.filter(clipboardData, function(item) {
        return ignoretypes.indexOf(item.nodeAttributes["type"]) >= 0;
      });
      status.container = status.container.clone();
      if (options.skipSingleRepoPaste !== true && operation === "copy" && !ignorableTypes.length) {
        return this._checkForSingleRepoPaste(status, options);
      } else {
        return NodeProgressCommand.prototype.execute.call(this, status, options);
      }
    },
    _performActions: function(status, options) {
      var operation = ClipboardManager.getOperation();
      if (!operation) {
        GlobalMessage.showMessage("error", lang.NoItemSelectedToPaste, undefined, {});
        return $.Deferred().reject().promise();
      }
      options.operation = operation;
      options.container = status.container;
      status.nodes = new NodeCollection(_.map(ClipboardManager.getStoredItems(), function(item) {
        var node = new NodeModel(item.nodeAttributes, {
          connector: options.container.connector
        });
        node._parentId = item.parentId;
        return node;
      }));
      return NodeProgressCommand.prototype._performActions.call(this, status, options);
    },
    doAction: function(node, options) {
      var me = this, deferred = $.Deferred(), operation = options.operation, container = options.container, url, method, payload;
      if (operation === "copy") {
        url = RestLinkrels.getLink(container.get("links"), RestLinkrels.OBJECTS);
        url = Url.appendQuery(url, Url.combineQueryString({
          "parent-id": node._parentId
        }));
        method = "POST";
        payload = JSON.stringify({
          href: RestLinkrels._getLinkMeta(node.get("links"), RestLinkrels.SELF)["href"],
          "retain-acl": true
        });
      } else if (operation === "cut") {
        url = RestLinkrels.getLink(node.get("links"), RestLinkrels.PARENT_LINKS) + "/" + node._parentId;
        method = "PUT";
        payload = JSON.stringify({
          href: RestLinkrels.getLink(container.get("links"), RestLinkrels.SELF),
          "child-id": node.get("id"),
          "parent-id": node._parentId
        });
      }
      $.ajax(container.connector.extendAjaxOptions({
        url: url,
        type: method,
        data: payload,
        headers: {
          "Content-Type": constants.MediaTypes.DCTM_JSON
        },
        success: function(response) {
          var id, newNode;
          if (response.properties) {
            id = response.properties.r_object_id;
          } else {
            id = response["child-id"];
          }
          newNode = new NodeModel({
            id: id
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
    _insertNodesIntoContainer: function(options) {
      const originatingView = options.originatingView, container = options.container;
      if (container.get("id") === originatingView.container.get("id")) {
        this._updateNodesCollection({
          originatingView: originatingView,
          collection: originatingView.collection,
          processedNodes: this._filterNodesInOriginalContainer(options.newNodesArr, container)
        });
      }
    },
    _filterNodesInOriginalContainer: function(nodes, container) {
      const containerId = container.get("id");
      return _.filter(nodes, node => node.get("i_folder_id").includes(containerId));
    },
    _updateNodesCollection: function({
      collection,
      originatingView,
      processedNodes
    }) {
      const newModelIds = new Set();
      processedNodes.forEach(node => {
        newModelIds.add(node.get("id"));
        node.isLocallyCreated = true;
      });
      let existingNodes = collection.allModels.filter(node => newModelIds.has(node.get("id"))), currPageNodes = collection.remove(existingNodes), remainingActualNodes = _.difference(existingNodes, currPageNodes);
      collection.allModels = collection.allModels.filter(model => !remainingActualNodes.includes(model));
      collection.lastFilteredAndSortedModels = collection.lastFilteredAndSortedModels?.filter(model => !newModelIds.has(model.get("id")));
      collection.totalCount = collection.allModels.length;
      collection.filteredCount = collection.lastFilteredAndSortedModels?.length;
      originatingView.paginationView.totalCount = collection.totalCount;
      collection.unshift(processedNodes);
      collection.lastFilteredAndSortedModels.splice(0, 0, ...processedNodes);
    },
    handleResults: function(results, options) {
      ClipboardManager.clear();
      var containerFetch = options.originatingView.container.fetch({
        force: true,
        reload: false
      });
      if (options.isSingleRepoPaste) {
        if (!results) {
          GlobalMessage.showMessage("info", lang.PasteItemsNoneMessage, undefined, {});
        }
        var me = this, promises = _.compact(_.map(results, function(result) {
          if (result instanceof Backbone.Model) {
            return me._refreshNode(result, options);
          }
        }));
        promises.push(containerFetch);
        return $.whenAll.apply($, promises);
      } else {
        this._insertNodesIntoContainer(options);
        return containerFetch;
      }
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.PastingOneItem,
        multiFilePending: lang.PastingManyItems,
        oneFileSuccess: lang.PasteOneItemSuccessMessage,
        multiFileSuccess: lang.PasteManyItemsSuccessMessage,
        oneFileFailure: lang.PasteOneItemFailMessage,
        multiFileOneFailure: lang.PasteManyItemsOneFailMessage,
        multiFileFailure: lang.PasteManyItemsFailMessage,
        someItemsStopped: lang.PasteStopped,
        actionType: "PASTE"
      };
    },
    _refreshNode: function(node, options) {
      var widgetConfig = {}, collection = options.originatingView.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
      }
      return CommandHelper.refreshNode(node, widgetConfig);
    },
    _getCreationProfilesUrl: function(status) {
      var url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_CREATION_PROFILES), containerNode = CreationUtils.getSourceContentNode(status), queryParams = {
        mode: constants.CreationProfileModes.SINGLE_REPO_PASTE,
        inline: true
      };
      if (containerNode) {
        queryParams["inherited-id"] = containerNode.get("id");
      }
      return Url.appendQuery(url, Url.combineQueryString(queryParams));
    },
    _getImportCmd: function() {
      var deferred = $.Deferred();
      require([ "d2/commands/import.file" ], function(ImportFileCommand) {
        var importCmd = new ImportFileCommand();
        deferred.resolve(importCmd);
      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise();
    },
    _checkForSingleRepoPaste: function(status, options) {
      var me = this, deferred = $.Deferred(), node = status.container;
      var clipboardData = ClipboardManager.getStoredItems();
      _.defaults(options, status);
      $.ajax(node.connector.extendAjaxOptions({
        url: this._getCreationProfilesUrl(status),
        success: function(response) {
          if (response && response.entries && response.entries.length > 0) {
            var resultHandler = function(results) {
              var def = $.Deferred();
              options.isSingleRepoPaste = true;
              me.handleResults(results, options).done(function() {
                _.each(results, function(result) {
                  if (result instanceof Backbone.Model) {
                    options.newNodesArr.push(result);
                  }
                });
                me._insertNodesIntoContainer(options);
                def.resolve();
              }).fail(function(err) {
                var error = err ? new CommandError(err) : err;
                def.reject(error);
              });
              return def.promise();
            };
            me._getImportCmd().done(function(cmd) {
              cmd.execute(status, {
                mode: constants.CreationProfileModes.SINGLE_REPO_PASTE,
                data: clipboardData,
                ignorePresetRetreival: true,
                messageOptions: me.getMessageOptions(),
                refreshNode: false
              }).done(function(results, nodeCollection, progressPanel) {
                _.defaults(options, {
                  commandContainer: node,
                  context: status.context,
                  progressPanel: true,
                  progressPanelView: progressPanel,
                  doneCommand: {
                    signature: "Browse",
                    label: lang.PasteItemDoneCommandLabel
                  }
                });
                nodeCollection && me._showSuccessMessage(nodeCollection.models, options);
                resultHandler(results).done(function() {
                  deferred.resolve();
                }).fail(function(err) {
                  deferred.reject(err);
                });
              }).fail(function(results) {
                resultHandler(results).always(function(err) {
                  deferred.reject(err);
                });
              });
            });
          } else {
            NodeProgressCommand.prototype.execute.call(me, status, options).done(deferred.resolve).fail(deferred.reject);
          }
        },
        error: function() {
          GlobalMessage.showMessage("error", lang.NoItemSelectedToPaste, undefined, {});
          deferred.reject();
        }
      }));
      return deferred.promise();
    }
  });
});