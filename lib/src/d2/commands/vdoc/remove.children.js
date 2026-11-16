/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/controls/globalmessage/globalmessage", "csui/models/fileuploads", "csui/utils/commands/node", "csui/utils/commandhelper", "d2/commands/vdoc/vdoc.mixin", "d2/utils/constants", "d2/utils/creation.utils", "d2/utils/rest.linkrels", "d2/utils/vdoc.utils", "d2/utils/vdoc.creation.utils", "i18n!d2/commands/nls/localized.strings" ], function(_, $, GlobalMessage, UploadFileCollection, NodeCommand, CommandHelper, VDocCommandMixin, constants, creationUtils, RestLinkrels, VdocUtils, vDocCreationUtils, lang) {
  "use strict";
  var parallelism = 1;
  var VDocRemoveChildren = NodeCommand.extend({
    defaults: {
      signature: "D2-VDocRemoveChildren",
      command_key: "D2-VDocRemoveChildren",
      name: lang.CommandVDocRemoveChildren,
      scope: "multiple"
    },
    execute: function(status, options) {
      var dfd = $.Deferred(), self = this;
      options = options || {};
      options.parallelism = parallelism;
      status.suppressFailMessage = true;
      status.suppressSuccessMessage = true;
      creationUtils.showConfirmationAlert(lang.RemoveVDConfirmTitle, lang.RemoveVDConfirmMessage, lang.RemoveVDConfirmYesButtonTitle, lang.RemoveVDConfirmCancelButtonTitle, true).done(function() {
        self._performActions(status, options).done(function(data) {
          if (status.parentList) {
            status.collection.refresh({
              vdmNumber: status.parentList
            }).done(function() {
              if (status.parentList.length === 1) {
                status.originatingView.trigger("activate:fallback:vdm", status.parentList[0]);
              } else {
                status.originatingView.trigger("activate:fallback:vdm");
              }
              dfd.resolve(data);
            }).fail(function(err) {
              self.showErrorMessage(err, status);
              dfd.reject(err);
            }).always(function() {
              delete status.parentList;
            });
          } else {
            dfd.resolve(data);
          }
        }).fail(function(err) {
          self.showErrorMessage(err, status);
          dfd.reject(err);
        });
      }).fail(function(err) {
        dfd.reject(err);
      });
      return dfd.promise();
    },
    _performAction: function(entry, node) {
      if (entry["content"].status === "200") {
        node.set({
          count: 1,
          state: "resolved"
        });
      } else {
        node.set({
          count: 1,
          state: "rejected",
          errorMessage: entry.message
        });
      }
    },
    _performActions: function(status, options) {
      var deferred = $.Deferred(), self = this;
      this._setUploadCollection(status, options);
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var parentNodeList = [], parentVDMList = [], parentIdToChildRelIdMap = {}, nodeIdList = nodes.map(function(node) {
        var parentVDMNumber = VdocUtils.getParentVDMNumber(node), parentNode = status.collection.get(parentVDMNumber), relId = VdocUtils.getVDRelationId(node);
        parentVDMList.push(parentVDMNumber);
        if (!parentIdToChildRelIdMap[parentNode.get("id")]) {
          parentNodeList.push(parentNode);
          parentIdToChildRelIdMap[parentNode.get("id")] = [ relId ];
        } else {
          if (!_.contains(parentIdToChildRelIdMap[parentNode.get("id")], relId)) {
            parentIdToChildRelIdMap[parentNode.get("id")].push(relId);
          }
        }
        return relId;
      });
      status.parentList = _.uniq(parentVDMList);
      vDocCreationUtils.performLockPrecheck(parentNodeList).always(function() {
        if (arguments.length && !arguments[0].id) {
          deferred.reject.apply(deferred, arguments);
          return;
        }
        _.each(arguments, function(nodeStatus) {
          if (nodeStatus.status !== "OK") {
            nodeIdList = _.difference(nodeIdList, parentIdToChildRelIdMap[nodeStatus.id]);
            status.parentList = _.without(status.parentList, VdocUtils.getVDMNumber(nodeStatus.node));
            _.each(parentIdToChildRelIdMap[nodeStatus.id], function(relId) {
              self._performAction({
                message: nodeStatus.responseJSON.details,
                content: {
                  status: "500"
                }
              }, status.removeCollection.find({
                relationId: relId
              }));
            });
          }
        });
        if (nodeIdList.length) {
          self._removeComponent(status, status.container, nodeIdList).done(function(data) {
            data.entries.forEach(function(entry) {
              self._performAction(entry, status.removeCollection.find({
                relationId: entry["content"]["relation-id"]
              }));
            });
            deferred.resolve(data);
          }).fail(function(err) {
            deferred.reject(err);
          });
        } else {
          delete status.parentList;
          deferred.resolve();
        }
      });
      return deferred.promise();
    },
    _setUploadCollection: function(status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status), queueItems = nodes.map(function(item, index) {
        return {
          name: item.get("name"),
          relationId: VdocUtils.getVDRelationId(item),
          state: index < parallelism ? "processing" : "pending",
          count: 0,
          total: 1,
          node: item
        };
      });
      status.removeCollection = new UploadFileCollection(queueItems, {
        connector: options.connector
      });
      status.removeCollection.each(function(item) {
        item.node = item.get("node");
        item.unset("node");
      });
      this._startGlobalMessage(status.removeCollection, options);
    },
    _startGlobalMessage: function(removeCollection) {
      this.progressPanel = GlobalMessage.showProgressPanel(removeCollection, {
        oneFilePending: lang.RemovingVDOneItem,
        multiFilePending: lang.RemovingVDManyItems,
        oneFileSuccess: lang.RemoveVDOneItemSuccessMessage,
        multiFileSuccess: lang.RemoveVDManyItemsSuccessMessage,
        oneFileFailure: lang.RemoveVDOneItemFailMessage,
        multiFileOneFailure: lang.RemoveVDManyItemsOneFailMessage,
        multiFileFailure: lang.RemoveVDManyItemsFailMessage,
        someItemsStopped: lang.RemoveVDStopped,
        actionType: "REMOVE"
      });
    },
    _removeComponent: function(status, node, nodeIdList) {
      var deferred = $.Deferred();
      var url = CommandHelper.getOriginalActionLink(status.nodes.models[0], this.get("signature"), RestLinkrels.D2_REMOVE_VD_CHILDREN, {
        "relation-ids": nodeIdList
      });
      if (!url) {
        deferred.reject(lang.RemoveVDLinkRelMissing);
      } else {
        $.ajax(node.connector.extendAjaxOptions({
          url: url,
          type: "DELETE",
          headers: {
            Accept: constants.MediaTypes.DCTM_JSON,
            "Content-Type": constants.MediaTypes.DCTM_JSON
          },
          success: function(data) {
            deferred.resolve(data);
          },
          error: function(xhr) {
            deferred.reject(xhr);
          }
        }));
      }
      return deferred.promise();
    },
    showErrorMessage: function(error, status) {
      status.removeCollection.map(removeModel => {
        this._performAction({}, removeModel);
      });
    }
  });
  VDocCommandMixin.mixin(VDocRemoveChildren.prototype);
  return VDocRemoveChildren;
});