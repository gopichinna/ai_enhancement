/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "d2/controls/table/cells/wf.associations.count/wf.associations.count.view", "d2/controls/table/cells/viewer.markup.count/markup.count.view", "d2/controls/table/cells/editing.online/editing.online.view" ], function(WfAssociationCountView, ViewerMarkupCountView, EditingOnlineView) {
  "use strict";
  return [ {
    sequence: 70,
    iconView: WfAssociationCountView
  }, {
    sequence: 80,
    iconView: ViewerMarkupCountView
  }, {
    sequence: 100,
    iconView: EditingOnlineView
  } ];
});