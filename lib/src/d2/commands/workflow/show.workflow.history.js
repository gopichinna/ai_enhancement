/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "csui/utils/commandhelper", "csui/utils/contexts/factories/application.scope.factory", "d2/utils/constants", "dctmw/utils/user.preference.storage", "d2/utils/contexts/factories/widget.view.state.factory", "i18n!d2/commands/nls/localized.strings" ], function(_, $, CommandModel, CommandHelper, ApplicationScopeModelFactory, constants, userPreference, WidgetViewStateModelFactory, lang) {
  "use strict";
  return CommandModel.extend({
    defaults: {
      signature: "D2-ShowWorkflowHistory",
      command_key: "D2-ShowWorkflowHistory",
      name: lang.CommandNameShowWorkflowHistory,
      scope: "single"
    },
    execute: function(status, options) {
      var context = status.context || options.context, appScope = context.getModel(ApplicationScopeModelFactory), viewStateModel = context.viewStateModel, node = CommandHelper.getJustOneNode(status), qParamData = JSON.stringify({
        "document-id": node.get("id"),
        "wf-states": [ constants.WorkflowState.SCHEDULED, constants.WorkflowState.PAUSED, constants.WorkflowState.RUNNING ]
      }), widgetViewStateModel = context.getObject(WidgetViewStateModelFactory);
      widgetViewStateModel && widgetViewStateModel.set("qform-param", qParamData);
      userPreference.saveLocalStorePreference(userPreference.StorageTypes.SEARCH_PANEL_VISIBILITY, constants.WidgetId.WORKFLOWS, true);
      viewStateModel.set("enabled", true);
      appScope.set("id", "allworkflows");
      status.collection.clearFilter(false);
      var state = viewStateModel.get(viewStateModel.CONSTANTS.STATE) || {};
      state = _.clone(state);
      state["filter"] = "";
      state["order_by"] = "";
      state["page"] = "";
      state["qform-param"] = "";
      viewStateModel.set(viewStateModel.CONSTANTS.STATE, state);
      return $.Deferred().resolve().promise();
    }
  });
});