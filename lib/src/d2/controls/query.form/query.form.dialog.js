/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "i18n", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/progressblocker/blocker", "csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin", "csui/utils/non-emptying.region/non-emptying.region", "d2/controls/query.form/query.form.panel.view", "d2/controls/query.form/query.form.model", "d2/controls/stepper.wizard/stepper.wizard.view", "hbs!d2/controls/query.form/impl/query.form.dialog", "i18n!d2/controls/query.form/impl/nls/lang", "css!d2/controls/query.form/impl/query.form.dialog", "csui/lib/binf/js/binf" ], function(_, $, i18n, Backbone, Marionette, BlockingView, LayoutViewEventsPropagationMixin, NonEmptyingRegion, QueryFormPanelView, QueryFormModel, StepperWizard, template, lang) {
  "use strict";
  function QueryFormDialog(options) {
    options || (options = {});
    this.options = options;
  }
  _.extend(QueryFormDialog.prototype, {
    show: function() {
      this._showWizard();
    },
    _createWizardSteps: function() {
      var step1 = {
        id: "queryformgeneral",
        title: this.options.savedSearchName,
        viewClass: QueryFormPanelView,
        viewOptions: this.options,
        buttons: [ {
          id: "next",
          toolTip: lang.search,
          label: lang.search,
          disabled: function() {
            return !this.isValidForm();
          },
          clickHandler: function() {
            this.executeQueryFormSearch();
          }
        } ]
      };
      var steparr = [];
      steparr.push(step1);
      return steparr;
    },
    _showWizard: function() {
      this.options.data = new QueryFormModel(this.options);
      var that = this;
      this.options.data.fetch().done(function() {
        that._steps = that._createWizardSteps();
        that._wizard = new StepperWizard({
          steps: that._steps,
          className: "d2-queryform-modal",
          data: {}
        });
        that._wizard.show();
      });
    }
  });
  return QueryFormDialog;
});