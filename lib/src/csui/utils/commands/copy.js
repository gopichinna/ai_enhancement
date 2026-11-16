/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/commands/copy.move", "csui/lib/radio", "csui/utils/command.error" ], function(module, require, _, $, lang, ActionModel, Radio, CommandError) {
  "use strict";
  var config = _.extend({}, module.config());
  _.defaults(config, {
    actionType: "copy",
    parallelism: 3,
    allowMultipleInstances: true
  });
  var CopyCommand = ActionModel.extend({
    defaults: {
      signature: "Copy",
      command_key: [ "copy", "Copy" ],
      name: lang.CommandNameCopy,
      verb: lang.CommandVerbCopy,
      pageLeavingWarning: lang.CopyPageLeavingWarning,
      allowMultipleInstances: config.allowMultipleInstances,
      scope: "multiple",
      successMessages: {
        formatForNone: lang.CopyItemsNoneMessage,
        formatForOne: lang.CopyOneItemSuccessMessage,
        formatForTwo: lang.CopySomeItemsSuccessMessage,
        formatForFive: lang.CopyManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: lang.CopyItemsNoneMessage,
        formatForOne: lang.CopyOneItemFailMessage,
        formatForTwo: lang.CopySomeItemsFailMessage,
        formatForFive: lang.CopyManyItemsFailMessage
      },
      labels: {
        actionName: lang.CopyingNodes,
        actionNode: lang.CopyingNode,
        commandTitle: lang.CommandTitleCopy,
        commandName: lang.CommandNameCopy,
        dialogTitle: lang.DialogTitleCopy,
        dialogTitleSingle: lang.DialogTitleSingleCopy,
        titleNotAllowed: lang.CopyNotAllowed
      },
      command: config.actionType
    },
    _doActionSelectedNodes: function(opts) {
      var exResult = $.Deferred();
      require([ "csui/utils/contexts/factories/next.node", "csui/controls/globalmessage/globalmessage", "csui/utils/taskqueue" ], _.bind(function(NextNodeModelFactory, GlobalMessage, TaskQueue) {
        var self = this, queue = new TaskQueue({
          parallelism: config.parallelism
        }), fileOrder = !!opts.targetFolder.get("fileOrder") ? opts.targetFolder.get("fileOrder") : 0, promises = _.map(opts.uploadCollection.models, function(model) {
          var deferred = $.Deferred();
          queue.pending.add({
            worker: function() {
              var attributes = model.attributes, targetId = opts.targetFolder.get("id");
              self._getCategories(attributes, opts.connector, targetId, opts.applyProperties).done(function(categories) {
                self._copyNode(categories, attributes, opts.connector, opts.targetFolder, model.node, fileOrder++).done(function() {
                  model.set("count", 1);
                  model.deferred.resolve(model);
                  opts.copyToCurrentFolder && self._addToCurrentTable(model.node, opts.collection);
                  deferred.resolve(attributes);
                }).fail(function(cause) {
                  var errMsg = new CommandError(cause);
                  model.deferred.reject(model, errMsg);
                  deferred.reject(errMsg);
                });
              }).fail(function(cause) {
                var errMsg = new CommandError(cause);
                model.deferred.reject(model, errMsg);
                deferred.reject(errMsg);
              });
              return deferred.promise();
            }
          });
          return deferred.promise(promises);
        });
        let defaultGlobalMsgData = {
          enableCancel: false,
          actionType: config.actionType,
          allowMultipleInstances: config.allowMultipleInstances,
          context: opts.context,
          nextNodeModelFactory: NextNodeModelFactory
        };
        let containerType = opts.uploadCollection.models.some(model => model.get("container"));
        const globalMessageData = this.updateGlobalMessage(containerType);
        GlobalMessage.showProgressPanel(opts.uploadCollection, {
          ...globalMessageData,
          ...defaultGlobalMsgData
        });
        this._unblockPageActions(opts.status);
        return $.whenAll.apply($, promises).then(exResult.resolve, exResult.reject);
      }, this), exResult.reject);
      return exResult.promise();
    },
    updateGlobalMessage: function(containerType) {
      return {
        oneFileTitle: lang.CopyingOneItem,
        oneFileSuccess: containerType ? lang.CopyableSubItemsProcessed : lang.CopyOneItemSuccessMessage,
        multiFileSuccess: containerType ? lang.CopyableSubItemsProcessed : lang.CopyManyItemsSuccessMessage,
        oneFilePending: lang.CopyingOneItem,
        multiFilePending: lang.CopyItems,
        multiFileOneFailure: lang.CopyManyItemsOneFailMessage,
        oneFileFailure: lang.CopyOneItemFailMessage,
        multiFileFailure: lang.CopyManyItemsFailMessage,
        someFileSuccess: lang.CopySomeItemsSuccessMessage,
        someFilePending: lang.CopySomeItems,
        someFileFailure: lang.CopySomeItemsFailMessage2,
        locationLabelPending: lang.CopyingLocationLabel,
        locationLabelCompleted: lang.CopiedLocationLabel
      };
    },
    _doPostExecute: function(opts) {
      var targetNodeIncurrentCollection;
      if (opts.status.collection && opts.status.originatingView && opts.status.originatingView.findNodeFromCollection) {
        targetNodeIncurrentCollection = opts.status.originatingView.findNodeFromCollection(opts.status.collection, opts.targetFolder);
      } else if (opts.status.collection) {
        targetNodeIncurrentCollection = opts.status.collection.get(opts.targetFolder.get("id")) || opts.status.collection.findWhere({
          id: opts.targetFolder.get("id")
        });
      }
      !opts.copyToCurrentFolder && targetNodeIncurrentCollection && targetNodeIncurrentCollection.fetch();
      Radio.channel("update:facets").trigger("update:facets");
      return opts.uploadCollection;
    },
    _copyNode: function(categories, instruction, connector, targetFolder, node, fileOrder) {
      var nodeAttr = {
        original_id: instruction.id,
        parent_id: targetFolder.get("id"),
        name: instruction.newName ? instruction.newName : instruction.name,
        roles: categories
      };
      targetFolder.get("type") === 136 && _.extend(nodeAttr, {
        order_new: targetFolder.get("order_next") + fileOrder
      });
      _.extend(nodeAttr, instruction.extended_data);
      _.isFunction(this.checkMultilingualInfo) && this.checkMultilingualInfo(instruction, nodeAttr);
      if (!node.connector) {
        connector.assignTo(node);
      }
      return node.save(undefined, {
        data: nodeAttr,
        url: connector.connection.url + "/nodes"
      });
    },
    _getCategories: function(attributes, connector, targetFolderID, applyProperties) {
      var deferred = $.Deferred(), self = this;
      if (attributes.extended_data && attributes.extended_data.roles) {
        deferred.resolve(attributes.extended_data.roles);
      } else if (!!applyProperties && applyProperties === 1) {
        deferred.resolve({});
      } else {
        var getCategoriesOptions = {
          url: connector.connection.url + "/forms/nodes/copy?" + $.param({
            id: attributes.id,
            parent_id: targetFolderID
          })
        };
        connector.makeAjaxCall(getCategoriesOptions).then(function(response) {
          var form = response.forms[1], data = form && form.data || {};
          var categoryGroupMapping;
          categoryGroupMapping = {};
          require([ "csui/dialogs/node.picker/impl/header/apply.properties.selector/apply.properties.selector.view" ], function(ApplyPropertiesSelectorView) {
            categoryGroupMapping[ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES] = "original";
            categoryGroupMapping[ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES] = "destination";
            categoryGroupMapping[ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES] = "merged";
            var categories = data[categoryGroupMapping[applyProperties]];
            deferred.resolve({
              categories: categories
            });
          });
        }).fail(function(error) {
          deferred.reject(error);
        });
      }
      return deferred.promise();
    }
  });
  return CopyCommand;
});