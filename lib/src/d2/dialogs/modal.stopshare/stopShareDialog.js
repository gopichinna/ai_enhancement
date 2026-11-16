/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "csui/controls/checkbox/checkbox.view", "d2/controls/behaviors/wizard.tabable.region.behavior", "hbs!d2/dialogs/modal.stopshare/impl/stopShareDialog", "css!d2/dialogs/modal.stopshare/impl/stopShareDialog" ], function(_, $, Backbone, Marionette, CheckboxView, WizardTabableRegionBehavior, template) {
  "use strict";
  var stopShareDialog = Marionette.LayoutView.extend({
    template: template,
    className: "d2-checkbox-message-container",
    events: {
      "click .d2-checkbox-caption": "toggleCheckBox",
      "keydown .d2-checkbox-caption": "toggleByKeyboard",
      keydown: "onKeyDown"
    },
    regions: {
      checkboxContainer: ".d2-checkbox-container"
    },
    constructor: function CheckboxMessageView() {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },
    behaviors: {
      TabableRegion: {
        behaviorClass: WizardTabableRegionBehavior
      }
    },
    onRender: function() {
      this.checkboxView = new CheckboxView(this.options);
      this.checkboxContainer.show(this.checkboxView);
      this.listenTo(this.checkboxView, "clicked", function(model) {
        this.trigger("checkbox:clicked", model);
      }, this);
    },
    getCheckboxView: function() {
      return this.checkboxView;
    },
    getCheckboxState: function() {
      return this.getCheckboxView().model.get("checked");
    },
    templateHelpers: function() {
      return {
        message: this.options.message,
        checkboxMessage: this.options.checkboxMessage
      };
    },
    toggleCheckBox: function() {
      this.checkboxView._toggleChecked();
    },
    toggleByKeyboard: function(e) {
      if (e.keyCode === 32) {
        this.checkboxView._toggleChecked();
      }
    },
    onKeyDown: function(e) {
      if (e.keyCode === 13 && $(e.target).is(this.checkboxView.$el.find(".csui-checkbox"))) {
        setTimeout(function() {
          this.checkboxView._toggleChecked();
        }.bind(this));
      }
    }
  });
  return stopShareDialog;
});