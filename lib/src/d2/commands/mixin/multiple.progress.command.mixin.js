/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "dctmw/utils/utils", "csui/utils/commandhelper", "i18n!d2/commands/nls/localized.strings" ], function($, _, utils, CommandHelper, lang) {
  "use strict";
  var MultipleProgressCommandMixin = {
    mixin: function(prototype) {
      _.extend(prototype, {
        makeMultipleProcessCommand: function() {
          return;
        },
        performPreCheckForInProgressItems: function(status, msgoptions) {
          var me = this;
          if (utils.isMobile()) {
            return $.Deferred().resolve().promise();
          }
          function getInprogressNodes() {
            var inprogressNodes = [];
            if (me.inProgressNodes) {
              _.each(_.keys(me.inProgressNodes), function(processId) {
                var nodesMap = me.inProgressNodes[processId];
                inprogressNodes = inprogressNodes.concat(_.keys(nodesMap));
              });
            }
            return inprogressNodes;
          }
          var dfd = $.Deferred(), inProgressNodeIds = getInprogressNodes(), selectedNodes = status.nodes.pluck("id"), intersectionArray = _.intersection(inProgressNodeIds, selectedNodes);
          if (intersectionArray && intersectionArray.length > 0) {
            require([ "csui/dialogs/modal.alert/modal.alert", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/new.file/node.processing.result.view" ], function(ModalAlert, D2ModalAlert, NodeProcessingResultView) {
              var intersectionNodes = status.nodes.filter(function(node) {
                return _.contains(intersectionArray, node.get("id"));
              }), alertContent = NodeProcessingResultView.create({
                collection: intersectionNodes,
                type: NodeProcessingResultView.Types.ERROR,
                title: ""
              }), buttonOptions = ModalAlert.buttons.Ok, modalAlertHeader = msgoptions.modalAlertHeader;
              buttonOptions["labelYes"] = lang.MultiProcessCommandErrorOKButtonLabel;
              var message;
              if (intersectionNodes.length === 1) {
                message = _.str.sformat(msgoptions.singleFileErrorMessage, intersectionNodes.at(0).get("name"));
                if (msgoptions.multiFileAddnlMessage) {
                  message = message + "\n\n" + msgoptions.multiFileAddnlMessage;
                }
                ModalAlert.confirmError(function() {
                  dfd.reject();
                }, message, modalAlertHeader, {
                  buttons: buttonOptions
                });
              } else {
                message = msgoptions.multiFileErrorMessage;
                if (msgoptions.multiFileAddnlMessage) {
                  message = message + "\n\n" + msgoptions.multiFileAddnlMessage;
                }
                D2ModalAlert.confirmError(function() {
                  dfd.reject();
                }, message, modalAlertHeader, {
                  buttons: buttonOptions,
                  contentView: alertContent,
                  modalClass: "alert-node-processing-error"
                });
              }
            });
          } else {
            this.setInProgressNodes(status);
            dfd.resolve();
          }
          return dfd.promise();
        },
        setInProgressNodes: function(status) {
          if (utils.isMobile()) {
            return;
          }
          var me = this, nodes = status.nodes;
          if (!me.inProgressNodes) {
            me.inProgressNodes = {};
          }
          if (nodes && nodes.length > 0) {
            var uniqueId = _.uniqueId("process_");
            status.uniqueProcessId = uniqueId;
            me.inProgressNodes[uniqueId] = nodes.reduce(function(map, node) {
              map[node.get("id")] = node;
              return map;
            }, {});
          }
        },
        unsetInProgressNodes: function(status) {
          if (status.uniqueProcessId) {
            delete this.inProgressNodes[status.uniqueProcessId];
          }
        }
      });
    }
  };
  return MultipleProgressCommandMixin;
});