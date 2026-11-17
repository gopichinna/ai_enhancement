/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/lib/underscore", "csui-ext!csui/widgets/metadata/impl/metadata.persistencereqswitchflow" ], function(_, extraFlows) {
  "use strict";
  const customFlows = [ {
    action: "create",
    priority: 2,
    decides: function(options) {
      return options.action === this.action;
    }
  }, {
    action: "copy",
    priority: 1,
    decides: function(options) {
      return options.action === this.action;
    }
  }, {
    action: "move",
    priority: 1,
    decides: function(options) {
      return options.action === this.action;
    }
  }, {
    action: "properties",
    priority: 2,
    decides: function(options) {
      return options.context?.getModel("applicationScope").id === this.action;
    }
  }, {
    type: 848,
    priority: 1,
    action: "businessworkspace",
    decides: function(options) {
      return options.node.attributes.type === this.type;
    }
  } ];
  let allFlows;
  if (!extraFlows) {
    allFlows = customFlows;
  } else {
    allFlows = _.extend(customFlows, extraFlows);
  }
  return {
    getPersistanceFlow: function(options) {
      const allAppliedFlows = allFlows.filter(obj => {
        try {
          return obj.decides(options) === true;
        } catch (err) {
          return false;
        }
      });
      let highPriority = Infinity;
      let highPriorityObject = null;
      for (const flow of allAppliedFlows) {
        if (flow.priority <= highPriority) {
          highPriority = flow.priority;
          highPriorityObject = flow;
        }
      }
      return highPriorityObject;
    }
  };
});