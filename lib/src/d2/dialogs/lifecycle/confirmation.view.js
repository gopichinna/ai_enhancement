/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "d2/utils/constants", "hbs!d2/dialogs/lifecycle/impl/confirmation", "i18n!d2/dialogs/lifecycle/impl/nls/lang", "css!d2/dialogs/lifecycle/impl/confirmation" ], function(_, $, Marionette, PerfectScrollingBehavior, constants, template, lang) {
  var ConfirmationView = Marionette.ItemView.extend({
    constructor: function ConfirmationView(options) {
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },
    className: "d2-lifecycle-confirmation",
    template: template,
    templateHelpers: function() {
      return {
        text: this.options.confirmationMessage || lang.NoInputRequiredMessage,
        showConfirmationImage: !!this.options.confirmationMessage
      };
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior
      }
    },
    getTitle: function() {
      return this.options.node && this.options.node.lifeCycleStateConfig && this.options.node.lifeCycleStateConfig["menu-label"] ? _.str.sformat(lang.ConfirmationView_Title, this.options.node.lifeCycleStateConfig["menu-label"]) : lang.ConfirmationView_Title_For_NoLifecycleStateConfig;
    },
    validate: function() {
      return true;
    },
    isValid: function() {
      return this.validate();
    },
    getItemModel: function() {
      return this.options.node;
    }
  });
  return ConfirmationView;
});