/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "require", "nuc/lib/underscore", "nuc/lib/jquery", "csui/models/command", "dctmw/controls/mixins/view.state/widget.view.state.mixin", "d2/utils/constants", "dctmw/utils/user.preference.storage", "d2/utils/contexts/factories/widget.view.state.factory", "i18n!d2/widgets/workflow.queryform/impl/nls/lang" ], function(require, _, $, CommandModel, WidgetViewStateMixin, constants, userPreference, WidgetViewStateModelFactory, lang) {
  "use strict";
  var AllWorkflowsQueryForm = CommandModel.extend({
    defaults: {
      signature: "D2-AllWorkflowsQueryForm"
    },
    enabled: function() {
      return true;
    },
    execute: function(options) {
      var me = this;
      me.options = options || {};
      me.context = me.options.context;
      me._openWizard();
    },
    _openWizard: function() {
      var action = this;
      require([ "d2/controls/stepper.wizard/stepper.wizard.view" ], function(StepperWizard) {
        action._createWizardSteps().then(function(wizardSteps) {
          action._wizard = new StepperWizard({
            steps: wizardSteps,
            className: "d2-wf-query-search-form",
            data: {}
          });
          action._wizard.show();
        });
      });
    },
    _createWizardSteps: function() {
      var me = this, dfd = $.Deferred();
      require([ "d2/widgets/workflow.queryform/impl/workflow.query.form.panel" ], function(WFQueryFormPanel) {
        var step = {
          id: "wfqueryform",
          title: me.options.title,
          viewClass: WFQueryFormPanel,
          viewOptions: {
            context: me.options.context,
            widgetName: me.options.widgetName,
            workflowsReportingType: me.options.workflowsReportingType,
            "document-id_storeContainer": true,
            "document-id_restoreContainer": true
          },
          buttons: [ {
            id: "next",
            toolTip: lang.search,
            label: lang.search,
            disabled: function() {
              return this.searchButtonDisabled;
            },
            clickHandler: function() {
              this.validateForm(true, false).done(_.bind(function(isValid) {
                if (isValid) {
                  var formValues, qParamData;
                  formValues = this.getFormValues();
                  if (formValues && !_.isEmpty(formValues)) {
                    qParamData = formValues ? JSON.stringify(formValues) : undefined;
                    var widgetViewStateModel = me.options.context.getObject(WidgetViewStateModelFactory);
                    widgetViewStateModel && widgetViewStateModel.set("qform-param", qParamData);
                    userPreference.saveLocalStorePreference(userPreference.StorageTypes.SEARCH_PANEL_VISIBILITY, constants.WidgetId.WORKFLOWS, true);
                    me.setViewStateWidgetName(me.options.widgetName);
                    me.options.context.viewStateModel.set("enabled", true);
                    me.options.applicationScope.set("id", "allworkflows");
                    me.trigger("open:workflows:perspective");
                    me._wizard.close();
                  }
                }
              }, this));
            }
          } ]
        };
        var steparr = [];
        steparr.push(step);
        dfd.resolve(steparr);
      });
      return dfd.promise();
    }
  });
  _.extend(AllWorkflowsQueryForm.prototype, WidgetViewStateMixin);
  return AllWorkflowsQueryForm;
});