/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "csui/lib/underscore", "csui/lib/jquery", "i18n!csui/utils/commands/nls/localized.strings", "csui/utils/commands/copy.move", "csui/utils/url", "csui/lib/radio", "csui/utils/command.error", "csui-ext!csui/utils/commands/move" ], function(module, require, _, $, lang, ActionModel, Url, Radio, CommandError, MoveCallEndPoint) {
  "use strict";
  var config = _.extend({}, module.config());
  _.defaults(config, {
    actionType: "move",
    parallelism: 3,
    allowMultipleInstances: true
  });
  var MoveCommand = ActionModel.extend({
    defaults: {
      signature: "Move",
      command_key: [ "move", "Move" ],
      name: lang.CommandNameMove,
      verb: lang.CommandNameVerbMove,
      pageLeavingWarning: lang.MovePageLeavingWarning,
      allowMultipleInstances: config.allowMultipleInstances,
      scope: "multiple",
      successMessages: {
        formatForNone: lang.MoveItemsNoneMessage,
        formatForOne: lang.MoveOneItemSuccessMessage,
        formatForTwo: lang.MoveSomeItemsSuccessMessage,
        formatForFive: lang.MoveManyItemsSuccessMessage
      },
      errorMessages: {
        formatForNone: lang.MoveItemsNoneMessage,
        formatForOne: lang.MoveOneItemFailMessage,
        formatForTwo: lang.MoveSomeItemsFailMessage,
        formatForFive: lang.MoveManyItemsFailMessage
      },
      labels: {
        actionName: lang.MovingNodes,
        actionNode: lang.MovingNode,
        commandTitle: lang.CommandTitleMove,
        commandName: lang.CommandNameMove,
        dialogTitle: lang.DialogTitleMove,
        dialogTitleSingle: lang.DialogTitleSingleMove,
        titleNotAllowed: lang.MoveNotAllowed
      },
      command: config.actionType
    },
    allowCollectionRefetch: false,
    _doActionSelectedNodes: function(opts) {
      var exResult = $.Deferred();
      require([ "csui/utils/contexts/factories/next.node", "csui/controls/globalmessage/globalmessage", "csui/utils/taskqueue" ], _.bind(function(NextNodeModelFactory, GlobalMessage, TaskQueue) {
        var self = this, queue = new TaskQueue({
          parallelism: config.parallelism
        }), selectedNodeIds = opts.status && opts.status.nodes && opts.status.nodes.models.map(function(model) {
          return model.get("id");
        });
        this.getExternalBodyParams(opts.connector, selectedNodeIds).then(function(extBodyParams) {
          var fileOrder = !!opts.targetFolder.get("fileOrder") ? opts.targetFolder.get("fileOrder") : 0;
          var promises = _.map(opts.uploadCollection.models, function(model) {
            var deferred = $.Deferred();
            queue.pending.add({
              worker: function() {
                var promise, attributes = model.attributes;
                model.node.trigger("before:move", model.node);
                if (attributes.extended_data && attributes.extended_data.roles) {
                  promise = self._actionNodeWithMetadata(attributes, opts.connector, opts.targetFolder.get("id"), opts.status, extBodyParams);
                } else {
                  promise = self._moveNode(attributes, opts.connector, opts.targetFolder, opts.applyProperties, opts.status, extBodyParams, fileOrder++);
                }
                promise.done(function() {
                  model.node.trigger("move", model.node);
                  model.set("count", 1);
                  model.deferred.resolve(model);
                  deferred.resolve(model);
                }).fail(function(cause) {
                  var errObj = new CommandError(cause);
                  model.deferred.reject(model, errObj);
                  deferred.reject(errObj);
                });
                return deferred.promise();
              }
            });
            return deferred.promise(promises);
          });
          return $.whenAll.apply($, promises).then(exResult.resolve, exResult.reject);
        });
        let hideGotoLocationSingleSet = false;
        if (opts.uploadCollection.length === 1) {
          const nodeid = opts.uploadCollection.models[0].get("id");
          const currentRouterFragment = opts.context.viewStateModel?.attributes?.currentRouterFragment;
          if (!currentRouterFragment.includes("navigator") && currentRouterFragment.includes(nodeid)) {
            hideGotoLocationSingleSet = true;
          }
        }
        GlobalMessage.showProgressPanel(opts.uploadCollection, {
          oneFileTitle: lang.MovingOneItem,
          oneFileSuccess: lang.MoveOneItemSuccessMessage,
          multiFileSuccess: lang.MoveManyItemsSuccessMessage,
          oneFilePending: lang.MovingOneItem,
          multiFilePending: lang.MovingItems,
          multiFileOneFailure: lang.MoveManyItemsOneFailMessage,
          oneFileFailure: lang.MoveOneItemFailMessage,
          multiFileFailure: lang.MoveManyItemsFailMessage,
          someFileSuccess: lang.MoveSomeItemsSuccessMessage,
          someFilePending: lang.MovingSomeItems,
          someFileFailure: lang.MoveSomeItemsFailMessage,
          locationLabelPending: lang.MovingLocationLabel,
          locationLabelCompleted: lang.MovedLocationLabel,
          enableCancel: false,
          actionType: config.actionType,
          allowMultipleInstances: config.allowMultipleInstances,
          context: opts.context,
          nextNodeModelFactory: NextNodeModelFactory,
          hideGotoLocationSingleSet: hideGotoLocationSingleSet
        });
        this._unblockPageActions(opts.status);
      }, this), exResult.reject);
      return exResult.promise();
    },
    _moveNode: function(instruction, connector, targetFolder, applyProperties, status, extBodyParams, fileOrder) {
      var self = this;
      var deferred = $.Deferred();
      var targetFolderID = targetFolder.get("id");
      return this._getCategories(connector, instruction.id, targetFolderID, applyProperties).then(function(categories) {
        var categoryGroupMapping;
        var bodyParam;
        var moveOptions;
        categoryGroupMapping = {};
        require([ "csui/dialogs/node.picker/impl/header/apply.properties.selector/apply.properties.selector.view" ], function(ApplyPropertiesSelectorView) {
          categoryGroupMapping[ApplyPropertiesSelectorView.KEEP_ORIGINAL_PROPERTIES] = "original";
          categoryGroupMapping[ApplyPropertiesSelectorView.APPLY_DESTINATION_PROPERTIES] = "destination";
          categoryGroupMapping[ApplyPropertiesSelectorView.COMBINE_ALL_PROPERTIES] = "merged";
          bodyParam = {
            parent_id: targetFolderID,
            name: instruction.newName ? instruction.newName : instruction.name,
            roles: {
              categories: categories[categoryGroupMapping[applyProperties]]
            }
          };
          targetFolder.get("type") === 136 && _.extend(bodyParam, {
            order_new: targetFolder.get("order_next") + fileOrder
          });
          _.extend(bodyParam, instruction.extended_data);
          _.isFunction(self.checkMultilingualInfo) && self.checkMultilingualInfo(instruction, bodyParam);
          bodyParam = _.extend({}, extBodyParams, bodyParam);
          moveOptions = {
            url: Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/nodes/", instruction.id),
            method: "PUT",
            data: bodyParam,
            contentType: connector.getAjaxContentType()
          };
          connector.makeAjaxCall(moveOptions).then(function(model) {
            deferred.resolve(model);
          }).fail(function(error) {
            deferred.reject(error);
          });
        });
        return deferred.promise();
      });
    },
    externalBodyParams: {},
    getExternalBodyParams: function(connector, selectedNodeIds) {
      return $.Deferred().resolve(this.externalBodyParams).promise();
    },
    _doPostExecute: function(opts) {
      var self = this, uploadFileModels = [], applicationScopeIds = [ "recentlyaccessed", "favorites", "searchresults", "myreserveditems" ], replaceParentId = applicationScopeIds.indexOf(opts.applicationScopeId) !== -1;
      let isSilent;
      if (opts.uploadCollection.models && opts.uploadCollection.models.length > 0) {
        isSilent = opts.uploadCollection.models.length > 1;
        _.each(opts.uploadCollection.models, function(filemodel) {
          if (replaceParentId) {
            filemodel.node.set("parent_id_expand", opts.targetFolder.attributes, {
              silent: isSilent
            });
          }
          uploadFileModels.push(filemodel.node);
        });
      }
      if (self.nodePicker && self.nodePicker._dialog && self.nodePicker._dialog.isDestroyed) {
        if (replaceParentId) {
          self.allowCollectionRefetch = "favorites" !== opts.applicationScopeId;
        } else {
          !isSilent && opts.status.collection && opts.status.collection.remove(uploadFileModels);
          self.allowCollectionRefetch = true;
        }
        Radio.channel("update:facets").trigger("update:facets");
        return uploadFileModels;
      }
    },
    _getCategories: function(connector, nodeID, targetFolderID, applyProperties) {
      if (!!applyProperties && applyProperties === 1) {
        return $.Deferred().resolve({}).promise();
      }
      var getCategoriesOptions = {
        url: connector.connection.url + "/forms/nodes/move?" + $.param({
          id: nodeID,
          parent_id: targetFolderID
        })
      };
      return connector.makeAjaxCall(getCategoriesOptions).then(function(response) {
        var form = response.forms[1];
        return form && form.data || {};
      });
    },
    _actionNodeWithMetadata: function(instruction, connector, targetFolderID, status, extBodyParams) {
      var self = this;
      var bodyParam = _.extend({}, extBodyParams, {
        parent_id: targetFolderID,
        name: instruction.newName ? instruction.newName : instruction.name
      }), moveOptions = {
        url: Url.combine(connector.getConnectionUrl().getApiBase("v2"), "/nodes/", instruction.id),
        method: "PUT",
        data: bodyParam,
        contentType: connector.getAjaxContentType()
      };
      _.extend(bodyParam, instruction.extended_data);
      return connector.makeAjaxCall(moveOptions);
    }
  });
  return MoveCommand;
});