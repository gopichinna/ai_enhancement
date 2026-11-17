/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "require", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/utils/log", "csui/controls/form/pub.sub", "i18n!d2/commands/nls/localized.strings" ], function(module, require, $, _, log, PubSub, lang) {
  "use strict";
  log = log(module.id);
  var concurrentProcessIds = [];
  PubSub.on("d2-all-process-completed", function() {
    log.debug("Concurrent Process Ids before all process complete:" + concurrentProcessIds) && console.log(log.last);
    concurrentProcessIds = [];
  });
  return {
    push: function(nodeIds) {
      concurrentProcessIds = _.unique(concurrentProcessIds.concat(nodeIds));
      log.debug("Concurrent Process Ids after push:" + concurrentProcessIds) && console.log(log.last);
    },
    pop: function(nodeIds) {
      if (!_.isArray(nodeIds)) {
        nodeIds = [ nodeIds ];
      }
      concurrentProcessIds = _.filter(concurrentProcessIds, function(value) {
        return nodeIds.indexOf(value) === -1;
      });
      log.debug("Concurrent Process Ids after pop:" + concurrentProcessIds) && console.log(log.last);
    },
    getInprogressIds: function() {
      return concurrentProcessIds;
    },
    isProgressPanelMinized: function() {
      return $(".module-d2-view .smart-progresspanel-wrapper").is(":hidden");
    },
    isProcessPending: function(nodes) {
      if (nodes && nodes.length > 0) {
        var inProgressIds = this.getInprogressIds(), processingNodes = nodes.filter(function(node) {
          return _.contains(inProgressIds, node.get("id"));
        });
        if (processingNodes && processingNodes.length > 0) {
          this.showMessageForProcessingNodes(processingNodes, nodes);
          return true;
        }
      }
      return false;
    },
    showMessageForProcessingNodes: function(processingNodes, nodes) {
      require([ "csui/dialogs/modal.alert/modal.alert", "dctmw/dialogs/modal.alert.custom.content/customizable.modal.alert", "d2/dialogs/new.file/node.processing.result.view" ], function(ModalAlert, D2ModalAlert, NodeProcessingResultView) {
        if (processingNodes && processingNodes.length > 1) {
          var alertContent = NodeProcessingResultView.create({
            collection: processingNodes,
            type: NodeProcessingResultView.Types.ERROR,
            title: _.str.sformat(lang.concurrentProcessingManyItemMessage, processingNodes.length, nodes.length),
            hideListTypeIcon: true
          }), buttonOptions = ModalAlert.buttons.Close;
          D2ModalAlert.confirmError(function() {
            return;
          }, lang.concurrentProcessingManyItemMessageDetails, lang.concurrentProcessingLabel, {
            buttons: buttonOptions,
            contentView: alertContent,
            modalClass: "alert-node-processing-error"
          });
        } else {
          ModalAlert.showError(_.str.sformat(lang.concurrentProcessingOneItemMessage, processingNodes[0].get("name")), lang.concurrentProcessingLabel);
        }
      });
    },
    listenForProcessMinimize: function(status, options, command) {
      var deferred = $.Deferred(), originatingView = status.originatingView || options.originatingView;
      if (status.nodes) {
        status.d2OrigSelectedNodes = status.nodes;
        status.nodes = status.nodes.clone();
      }
      command.stopListening(PubSub, "d2-process-minimized");
      command.listenTo(PubSub, "d2-process-minimized", function() {
        if (deferred.state() === "resolved") {
          return;
        }
        deferred.resolve();
        originatingView && originatingView.unblockActions && originatingView.unblockActions();
      });
      return deferred.promise();
    }
  };
});