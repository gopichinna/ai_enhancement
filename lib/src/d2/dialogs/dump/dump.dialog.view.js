/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "d2/dialogs/dump/impl/dump.form.view", "d2/controls/stepper.wizard/stepper.wizard.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "i18n!d2/dialogs/dump/impl/nls/lang", "css!d2/dialogs/dump/impl/dump.dialog" ], function(_, $, DumpFormView, StepperWizard, PerfectScrollingBehavior, lang) {
  "use strict";
  var DumpDialog = StepperWizard.extend({
    constructor: function DumpDialog(options) {
      options = options || {};
      this._steps = this._createWizardSteps();
      this.options = _.defaults(options, {
        steps: this._steps,
        className: "d2-dump cs-metadata-properties d2-metadata-properties"
      });
      StepperWizard.prototype.constructor.call(this, this.options);
    },
    behaviors: _.extend(StepperWizard.prototype.behaviors, {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".binf-modal-body",
        suppressScrollX: true
      }
    }),
    _createWizardSteps: function() {
      var step1 = {
        id: "dump",
        title: lang.WizardTitle,
        subTitle: function() {
          return this.getSubTitle();
        },
        viewClass: DumpFormView,
        viewOptions: this.options,
        buttons: [ {
          id: "next",
          toolTip: lang.ButtonCopy,
          label: lang.ButtonCopy,
          disabled: function() {
            return !this.isFormRendered();
          },
          clickHandler: function() {
            this.executeCopy();
          }
        } ]
      };
      var steparr = [];
      steparr.push(step1);
      return steparr;
    }
  });
  return DumpDialog;
});