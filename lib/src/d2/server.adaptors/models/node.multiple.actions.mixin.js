/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "csui/utils/contexts/factories/application.scope.factory", "d2/utils/constants", "d2/utils/widget.constants" ], function(_, ApplicationScopeModelFactory, constants, widgetConstants) {
  "use strict";
  return {
    mixin: function(prototype) {
      var superPrepareModel = prototype._prepareModel, superRequestPromotedActions = prototype._requestPromotedActions, superUpdateOriginalActions = prototype._updateOriginalActions;
      return _.extend(prototype, {
        _prepareModel: function(attrs, options) {
          var model = superPrepareModel.call(this, attrs, options);
          if (model.get("menuType")) {
            model.delayedActions.menuType = model.get("menuType");
            model.setNonPromotedActionsOptions({
              menuType: model.get("menuType")
            });
          }
          if (model.get("widgetType")) {
            model.delayedActions.widgetType = model.get("widgetType");
            model.setNonPromotedActionsOptions({
              widgetType: model.get("widgetType")
            });
            model.widgetType = model.get("widgetType");
          }
          var context = model.options && model.options.connector && model.options.connector.context, applicationScope = context && context.getModel(ApplicationScopeModelFactory);
          if (applicationScope && applicationScope.get("id") === "properties" && (model.get("rObjectType") === "d2c_workflow_tracker" || model.get("r_object_type") === "d2c_workflow_tracker")) {
            model.set("csuiLazyActionsRetrieved", true, {
              silent: true
            });
            model.set("csuiDelayedActionsRetrieved", true, {
              silent: true
            });
          }
          return model;
        },
        _requestPromotedActions: function(model) {
          var me = this, workflowsWithRetrievedActions = [];
          this.each(function(model) {
            if (model.get("type") === constants.Types.WORKFLOW) {
              if (!model.get("csuiDelayedActionsRetrieved")) {
                me.hasWorkflowTracker = true;
                model.set("csuiDelayedActionsRetrieved", true, {
                  silent: true
                });
              } else {
                workflowsWithRetrievedActions.push(model);
              }
            }
          });
          superRequestPromotedActions.call(this, model);
          this.each(function(model) {
            if (model.get("type") === constants.Types.WORKFLOW && !_.contains(workflowsWithRetrievedActions, model)) {
              model.unset("csuiDelayedActionsRetrieved", {
                silent: true
              });
            }
          });
        },
        _updateOriginalActions: function() {
          superUpdateOriginalActions.call(this);
          if (this.hasWorkflowTracker) {
            this.delayedActions.menuType = constants.MenuTypes.WORKFLOWS;
            this.delayedActions.widgetType = widgetConstants.D2.WORKFLOWS;
            superRequestPromotedActions.call(this, this);
            this.hasWorkflowTracker = false;
          }
        }
      });
    }
  };
});