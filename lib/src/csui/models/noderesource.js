/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "csui/lib/underscore", "csui/utils/log", "csui/models/nodeconnectable", "csui/models/fetchable", "csui/models/nodeautofetchable" ], function(module, _, log, NodeConnectableModel, FetchableModel, NodeAutoFetchableModel) {
  "use strict";
  log = log(module.id);
  function NodeResourceModel(ParentModel) {
    var prototype = {
      makeNodeResource: function(options) {
        return this.makeNodeConnectable(options).makeFetchable(options).makeNodeAutoFetchable(options);
      }
    };
    prototype.NodeResource = _.clone(prototype);
    return _.extend({}, NodeConnectableModel(ParentModel), FetchableModel(ParentModel), NodeAutoFetchableModel(ParentModel), prototype);
  }
  return NodeResourceModel;
});