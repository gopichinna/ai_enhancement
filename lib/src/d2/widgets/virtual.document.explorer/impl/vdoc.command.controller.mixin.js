/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/utils/log", "d2/utils/vdoc.utils" ], function(module, _, log, vdUtil) {
  "use strict";
  log = log(module.id);
  var logPrefix = "VD CMD-Ctrl";
  return {
    mixin: function(prototype) {
      _.extend(prototype, {
        _beforeExecuteCommand: function(commandArgs, options) {
          options = options || {};
          var nodes = commandArgs.status && commandArgs.status.nodes, origSelectedNodes = commandArgs.status && commandArgs.status.d2OrigSelectedNodes;
          if (nodes) {
            var clonedNodes = nodes.map(function(nodeModel) {
              var node = nodeModel.clone();
              node.origNode = nodeModel;
              log.debug("{0} - before execute - src - {1} - dest - {2}", logPrefix, vdUtil.getLogPrintableDetails(node.origNode), vdUtil.getLogPrintableDetails(node)) && console.log(log.last);
              node[vdUtil.MEM_TSTAMP] = nodeModel[vdUtil.MEM_TSTAMP];
              return node;
            });
            nodes.reset(clonedNodes, _.defaults({}, options, {
              silent: true
            }));
            origSelectedNodes && origSelectedNodes.reset(clonedNodes, _.defaults({}, options, {
              silent: true
            }));
          }
        },
        _afterExecuteCommand: function(commandArgs, options) {
          options = options || {};
          var nodes = commandArgs.status && commandArgs.status.nodes, origSelectedNodes = commandArgs.status && commandArgs.status.d2OrigSelectedNodes, origNodes = [];
          if (nodes) {
            nodes.each(function(nodeModel) {
              log.debug("{0} - after execute - src - {1} - dest - {2}", logPrefix, vdUtil.getLogPrintableDetails(nodeModel), vdUtil.getLogPrintableDetails(nodeModel.origNode)) && console.log(log.last);
              vdUtil.syncToOriginalVDNode(nodeModel);
              origNodes.push(nodeModel.origNode);
              delete nodeModel.origNode;
            });
            nodes.reset(origNodes, _.defaults({}, options, {
              silent: true
            }));
            origSelectedNodes && origSelectedNodes.reset(origNodes, _.defaults({}, options, {
              silent: true
            }));
          }
        }
      });
      return prototype;
    }
  };
});