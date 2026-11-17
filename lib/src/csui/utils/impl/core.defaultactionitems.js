/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/classic.nodes/classic.nodes", "csui/utils/smart.nodes/smart.nodes" ], function(classicNodes, smartNodes) {
  "use strict";
  return [ {
    equals: {
      type: [ 144, 736, 801 ]
    },
    signature: "OpenDocument",
    sequence: 10
  }, {
    equals: {
      type: [ 2 ]
    },
    signature: "Open",
    sequence: 10
  }, {
    type: 140,
    signature: "Navigate",
    sequence: 30
  }, {
    type: 258,
    signature: "ExecuteSavedQuery",
    sequence: 30
  }, {
    type: 292,
    signature: "ExecuteSearchForm",
    sequence: 30
  }, {
    signature: "OpenSpecificClassicPage",
    sequence: 600,
    decides: function(node) {
      return classicNodes.isForced(node);
    }
  }, {
    equals: {
      container: true
    },
    signature: "Browse",
    sequence: 700
  }, {
    signature: "OpenSpecificNodePerspective",
    sequence: 800,
    decides: function(node) {
      return smartNodes.isSupported(node);
    }
  } ];
});