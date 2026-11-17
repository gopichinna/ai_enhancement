/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/constants" ], function(Constants) {
  "use strict";
  return [ {
    equals: {
      id: Constants.NodeId.REPOSITORY
    },
    className: "d2-tree-icon-repository",
    sequence: 51
  }, {
    equals: {
      id: Constants.NodeId.FAVORITES
    },
    className: "d2-tree-icon-favorites",
    sequence: 52
  }, {
    equals: {
      _is_home_cabinet: true
    },
    className: "d2-tree-icon-home-cabinet",
    sequence: 53
  } ];
});