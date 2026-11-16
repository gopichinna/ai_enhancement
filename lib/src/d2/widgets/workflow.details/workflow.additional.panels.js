/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "i18n!d2/widgets/workflow.details/impl/nls/lang", "d2/widgets/workflow.details/impl/task.details.tab.view", "d2/widgets/workflow.details/impl/workflow.details.tab.view" ], function(lang, TaskDetailsTabView, WFDetailsTabView) {
  "use strict";
  return [ {
    title: lang.titleTabWorkflowDetails,
    name: "wf_details",
    sequence: 8,
    contentView: WFDetailsTabView
  }, {
    title: lang.titleTabTaskDetails,
    name: "task_details",
    sequence: 9,
    contentView: TaskDetailsTabView
  } ];
});