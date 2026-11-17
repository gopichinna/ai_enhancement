/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data" ], function(mergeExtraData) {
  "use strict";
  return function implementExtraData(extraNodeData) {
    return {
      getModelFields: function(options) {
        if (!extraNodeData) {
          return {};
        }
        var objects = extraNodeData.map(function(nodeData) {
          return nodeData.getModelFields && nodeData.getModelFields(options);
        });
        return mergeExtraData(objects);
      },
      getModelExpand: function(options) {
        if (!extraNodeData) {
          return {};
        }
        var objects = extraNodeData.map(function(nodeData) {
          return nodeData.getModelExpand && nodeData.getModelExpand(options);
        });
        return mergeExtraData(objects);
      }
    };
  };
});