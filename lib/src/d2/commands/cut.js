/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "d2/controls/globalmessage/globalmessage", "csui/models/command", "nuc/utils/base", "csui/utils/commandhelper", "d2/utils/clipboard.manager", "d2/utils/rest.linkrels", "d2/utils/server.query.utils", "d2/utils/constants", "d2/utils/widget.constants", "i18n!d2/commands/nls/localized.strings" ], function($, _, GlobalMessage, CommandModel, base, CommandHelper, ClipboardManager, RestLinkrels, serverQueryUtils, constants, widgetConstants, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-Cut",
      command_key: "D2-Cut",
      name: lang.CommandNameCut,
      pageLeavingWarning: lang.CutPageLeavingWarning,
      scope: "multiple"
    },
    execute: function(status) {
      const nodes = CommandHelper.getAtLeastOneNode(status);
      return this._getContainerId(nodes, status).then(containerId => {
        return this._performCutAction(containerId, nodes, status);
      });
    },
    _getContainerId: function(nodes, status) {
      const deferred = $.Deferred(), isContainerAction = nodes.length === 1 && nodes.at(0) === status.container;
      let containerId = null;
      require([ "csui/utils/contexts/factories/ancestors", "csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view" ], (AncestorCollectionFactory, MetadataNavigationView) => {
        if (isContainerAction || status.originatingView instanceof MetadataNavigationView) {
          const ancestorModel = status.context.getCollection(AncestorCollectionFactory).at(-2);
          deferred.resolve(ancestorModel.get("id"));
        } else {
          if (status.container && status.container?.get("type") !== constants.Types.TASK) {
            containerId = status.container.get("id");
          }
          deferred.resolve(containerId);
        }
      }, deferred.reject);
      return deferred.promise();
    },
    _performCutAction: function(containerId, nodes, status) {
      const me = this, deferred = $.Deferred(), cutData = nodes.map(function(node) {
        var parentId;
        if (containerId) {
          parentId = containerId;
        } else {
          parentId = node.get("i_folder_id");
        }
        if (_.isArray(parentId)) {
          parentId = parentId[0];
        }
        return {
          nodeAttributes: _.clone(node.attributes),
          parentId: parentId
        };
      });
      if (!cutData || cutData.length === 0) {
        deferred.reject();
        GlobalMessage.showMessage("error", lang.CutItemsNoneMessage);
      } else if (status.container) {
        ClipboardManager.storeCutItems(cutData);
        serverQueryUtils.fetchActions({
          menuType: constants.MenuTypes.CONTEXT,
          widgetType: widgetConstants.D2.DOCLIST,
          ids: _.uniq(_.map(cutData, function(entry) {
            return entry.parentId;
          })),
          connector: status.container.connector
        }).done(function(nodeActions) {
          nodeActions = _.toArray(nodeActions);
          var permittedActions = nodeActions[0], origActions = status.collection ? status.collection.node.attributes.actions : status.container.attributes.actions;
          if (!status.collection) {
            status.container.attributes.actions = _.uniq(_.union(origActions, _.where(permittedActions, {
              signature: "D2-Paste"
            })), "signature");
          } else {
            status.collection.node.attributes.actions = _.uniq(_.union(origActions, _.where(permittedActions, {
              signature: "D2-Paste"
            })), "signature");
          }
          me._showGlobalMessage(cutData);
          status.container.fetch({
            force: true,
            reload: true
          });
        });
        deferred.resolve();
      } else {
        ClipboardManager.storeCutItems(cutData);
        me._showGlobalMessage(cutData);
        deferred.resolve();
      }
      return deferred.promise();
    },
    _showGlobalMessage: function(cutData) {
      var successMessage = cutData.length === 1 ? _.str.sformat(lang.CutOneItemSuccessMessage, cutData[0].nodeAttributes.name) : _.str.sformat(lang.CutManyItemsSuccessMessage, cutData.length);
      GlobalMessage.showMessage("success", successMessage, undefined, {});
    }
  });
});