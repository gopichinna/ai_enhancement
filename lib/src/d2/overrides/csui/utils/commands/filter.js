/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/commands/filter", "dctmw/server.adaptors/converters/node", "d2/utils/constants" ], function(_, FilterCommand, nodeConverter, Constants) {
  "use strict";
  var proto = FilterCommand.prototype, origEnabled = proto.enabled;
  proto.enabled = function(status) {
    var container = status.container, view = status.originatingView;
    if (status.toolItem && status.toolItem.get("tasksFilter") === true) {
      return true;
    }
    if (container?.get("type") === Constants.Types.COLLECTIONS) {
      return true;
    }
    if (container && nodeConverter.isNonDCTMNode(container)) {
      return false;
    }
    if (view && view.collection && (_.isEmpty(view.collection.facetConfig) && view.collection?.avaliableD2FilterConfigFacets?.topics?.length === 0)) {
      return false;
    }
    return origEnabled.apply(this, arguments);
  };
});