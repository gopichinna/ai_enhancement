/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/utils/node.state.icons/workflow.association", "d2/utils/node.state.icons/viewer.markup.count", "d2/utils/node.state.icons/editing.online" ], function(WorkflowAssociationNodeState, ViewerMarkupCount, EditingOnlineNodeState) {
  "use strict";
  return [ {
    clientKey: "d2_wf_association_count",
    serverKey: "wf_associations",
    utility: WorkflowAssociationNodeState
  }, {
    clientKey: "viewer_markup_count",
    serverKey: "markup_count",
    utility: ViewerMarkupCount
  }, {
    clientKey: "d2_editing_online",
    serverKey: "d2_editing_online",
    utility: EditingOnlineNodeState
  } ];
});