/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "csui/models/command", "nuc/models/node/node.model", "csui/utils/commandhelper", "d2/commands/node.progress.command", "d2/controls/globalmessage/globalmessage", "d2/dialogs/bws/create.bws.instance/create.bws.dialog", "i18n!d2/commands/nls/localized.strings", "dctmw/utils/rest.resources", "dctmw/utils/rest.linkrels", "d2/utils/constants" ], function($, _, CommandModel, NodeModel, CommandHelper, NodeProgressCommand, GlobalMessage, CreateBwsDialog, lang, RestResources, RestLinkrels, constants) {
  "use strict";
  return NodeProgressCommand.extend({
    defaults: {
      signature: "D2-Create-Workspace",
      command_key: "D2-Create-Workspace",
      name: lang.commandNameCreateBWS,
      scope: "single"
    },
    enabled: function() {
      return true;
    },
    execute: function(status, options) {
      options = options || {};
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      options.newNodesArr = [];
      status.container = status.container.clone();
      options.container = status.container;
      let deferred = $.Deferred();
      options.data = _.clone(status?.data);
      let dlg = new CreateBwsDialog(options);
      dlg.show().done(function(data) {
        if (!data.isCancel) {
          status.nodes = data.collection;
          NodeProgressCommand.prototype.execute.call(this, status, options).done(deferred.resolve).fail(deferred.reject);
        } else {
          deferred.resolve();
        }
      }.bind(this)).fail(deferred.reject);
      return deferred.promise();
    },
    _performActions: function(status, options) {
      options.container = status.container;
      return NodeProgressCommand.prototype._performActions.call(this, status, options);
    },
    doAction: function(node, options) {
      let deferred = $.Deferred();
      let me = this, newNode;
      let url = RestLinkrels.getLink(RestResources.getCurrentRepository().get("links"), RestLinkrels.D2_BUSINESS_WORKSPACE);
      let connector = options.container.connector;
      let payload = {
        "template-id": options?.data["template-id"],
        "bws-parent-folder-id": options?.container?.attributes?.id,
        type: options?.data["bws-type-def"],
        properties: node._changedFormValuesMap.properties
      };
      if (!payload?.properties?.object_name) {
        payload.properties.object_name = node.get("name");
      }
      let ajaxOptions = connector.extendAjaxOptions({
        url: url,
        type: "POST",
        contentType: constants.MediaTypes.JSON,
        data: JSON.stringify(payload),
        success: function(response) {
          let newDataNode = response.properties;
          if (response?.properties) {
            newDataNode.id = response?.properties?.r_object_id;
          }
          newNode = new NodeModel(newDataNode, {
            connector: options.container.connector
          });
          me._refreshNode(newNode, options).done(function() {
            options.newNodesArr.push(newNode);
            deferred.resolve(newNode);
          });
        },
        error: function(xhr, status, error) {
          console.error("Error creating Business Workspace:", error);
          deferred.reject(error);
        }
      });
      var connectorError = ajaxOptions.error;
      ajaxOptions.error = function(xhr, message, statusText) {
        if (xhr.responseJSON && xhr.responseJSON.status === 401 && xhr.responseJSON.code !== "E_INVALID_AUTHENTICATION") {
          connectorError.apply(this, arguments);
        }
        deferred.reject(xhr, message, statusText);
      };
      $.ajax(ajaxOptions);
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
      let containerFetch = options.originatingView.container.fetch({
        force: true,
        reload: false
      });
      this._insertNodesIntoContainer(options);
      return containerFetch;
    },
    getMessageOptions: function() {
      return {
        oneFilePending: lang.BWSCreatingOneItem,
        multiFilePending: lang.BWSCreatingManyItems,
        oneFileSuccess: lang.BWSCreateOneItemSuccessMessage,
        multiFileSuccess: lang.BWSCreateManyItemsSuccessMessage,
        oneFileFailure: lang.BWSCreateOneItemFailMessage,
        multiFileOneFailure: lang.BWSCreateManyItemsOneFailMessage,
        multiFileFailure: lang.BWSCreateManyItemsFailMessage,
        someItemsStopped: lang.BWSCreateStopped,
        actionType: "CREATEBWS"
      };
    },
    _refreshNode: function(node, options) {
      let widgetConfig = {}, collection = options.originatingView.collection;
      if (collection && collection.options) {
        widgetConfig.widgetType = collection.widgetType;
        widgetConfig.widgetName = collection.options.widgetName;
        widgetConfig.isDisableLocationColumn = collection.options.isDisableLocationColumn;
      }
      return CommandHelper.refreshNode(node, widgetConfig);
    }
  });
});