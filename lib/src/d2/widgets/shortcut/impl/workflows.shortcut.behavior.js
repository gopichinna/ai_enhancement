/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/utils/commands", "csui/utils/contexts/factories/application.scope.factory", "d2/utils/constants", "d2/widgets/shortcut/shortcut.behavior" ], function(commands, ApplicationScopeModelFactory, constants, ShortcutBehavior) {
  "use strict";
  var WorkflowShortcutBehavior = ShortcutBehavior.extend({
    onClick: function() {
      var appScope = this.options.context.getModel(ApplicationScopeModelFactory), options = {
        title: this.options.data.title,
        context: this.options.context,
        widgetName: this.options.data.widgetName,
        workflowsReportingType: constants.WorkflowsReportingType.ALL,
        applicationScope: appScope
      };
      var executeAllWorkflowQuerySearch = commands.get("D2-AllWorkflowsQueryForm");
      executeAllWorkflowQuerySearch.execute(options);
    }
  });
  return WorkflowShortcutBehavior;
});