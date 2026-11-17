/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/jquery", "nuc/lib/handlebars", "nuc/lib/marionette", "csui/behaviors/keyboard.navigation/tabables.behavior", "csui/controls/form/pub.sub" ], function(_, Backbone, $, Handlebars, Marionette, TabablesBehavior, PubSub) {
  var D2FieldEditableBehavior = Marionette.Behavior.extend({
    constructor: function D2FieldEditableBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.listenTo(view, "field:changed", this.onFieldValueChange.bind(this));
      this.listenTo(view, "field:change:revert", this.revertFieldChanges.bind(this));
      this.listenTo(view, "field:invalid", this.disableSaveButton.bind(this));
      this.listenTo(PubSub, "d2:form:interaction:performed", this.onFormInteractionPerformed.bind(this));
    },
    ui: function() {
      return _.extend({
        editIcon: ".d2-icon-edit",
        saveIcon: ".d2-edit-save",
        cancelIcon: ".d2-edit-cancel",
        icons: ".inline-edit-icon",
        readArea: ".cs-field-read",
        readAreaInner: ".cs-field-read-inner",
        readButton: ".cs-field-read .btn-container button",
        writeArea: ".cs-field-write"
      }, this.view.ui);
    },
    events: {
      "click @ui.editIcon": "onEditIconClicked",
      "keydown @ui.editIcon": "onKeyEdit",
      "focusout @ui.editIcon": "onFocusOutEdit",
      "keyup @ui.editIcon": "onKeyUpForEsc",
      "focusin @ui.editIcon": "onFocusInEdit",
      "click @ui.saveIcon": "onSaveIconClicked",
      "keydown @ui.saveIcon": "onKeySave",
      "keyup @ui.saveIcon": "onKeyUpForEsc",
      "click @ui.cancelIcon": "onCancelClicked",
      "keydown @ui.cancelIcon": "onKeyCancel",
      "keyup @ui.cancelIcon": "onKeyUpForEsc",
      "mouseleave @ui.readArea": "onMouseOutRead",
      "mouseover @ui.readArea": "onMouseOverRead",
      "mousedown @ui.writeField": "onMouseDownWrite",
      "keydown @ui.writeField": "onKeyWrite",
      "keyup @ui.writeField": "onKeyUpForEsc"
    },
    onRender: function() {
      if (this.view.mode !== "writeonly") {
        if (this.isEditMode) {
          this.setViewStateWriteAndEnterEditMode();
        } else {
          this.setViewReadOnlyAndLeaveEditMode();
        }
      } else {
        this._hideCancelIcon();
        this._hideReadArea();
      }
    },
    _showCancelIcon: function() {
      this.ui.cancelIcon.show();
    },
    _hideCancelIcon: function() {
      this.ui.cancelIcon.addClass("binf-hidden");
    },
    _showEditIcon: function() {
      this.ui.editIcon.css("opacity", 1);
    },
    _hideEditIcon: function() {
      this.ui.editIcon.css("opacity", 0);
    },
    _hideReadArea: function() {
      this.ui.readArea.addClass("binf-hidden");
    },
    setViewReadOnlyAndLeaveEditMode: function() {
      this.ui.writeArea.addClass("binf-hidden");
      this.ui.readArea.removeClass("binf-hidden");
      this._hideEditIcon();
      this.view.trigger("field:readonly");
      this.isEditMode = false;
    },
    setViewStateWriteAndEnterEditMode: function() {
      this.ui.writeArea.removeClass("binf-hidden");
      this.ui.readArea.addClass("binf-hidden");
      this.ui.writeField.attr("tabindex", 0);
      this.ui.writeField.trigger("focus");
      this.view.trigger("field:editable");
      this.disableSaveButton();
      this.isEditMode = true;
      PubSub.trigger("d2:form:interaction:performed", this.ui.editIcon);
    },
    hasReadFocus: function() {
      var bHasFocus = this.ui.editIcon.is(":focus");
      return bHasFocus;
    },
    onEditIconClicked: function(event) {
      this.setViewStateWriteAndEnterEditMode();
      event.preventDefault();
      event.stopPropagation();
    },
    onKeyEdit: function(event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.setViewStateWriteAndEnterEditMode();
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onSaveIconClicked: function(event) {
      this.checkAndsaveFieldChanges();
      event.preventDefault();
      event.stopPropagation();
    },
    onKeySave: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.checkAndsaveFieldChanges();
        break;

       case 9:
        this.focusNextTabableElement(event);
        break;

       default:
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    onCancelClicked: function(event) {
      this.revertFieldChanges(true);
      event.preventDefault();
      event.stopPropagation();
    },
    onKeyCancel: function(event) {
      switch (event.keyCode) {
       case 13:
       case 32:
        this.isEditMode = false;
        this.revertFieldChanges();
        break;

       case 9:
        this.focusNextTabableElement(event);
        break;

       default:
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    focusNextTabableElement: function(event) {
      var focusableEl = this.getNextFocusableElementInWriteField(event.currentTarget, event.shiftKey);
      if (focusableEl) {
        $(focusableEl).focus();
      }
    },
    getNextFocusableElementInWriteField: function(currentEl, isShift) {
      var tabableElements = _.isFunction(this.view.getFocusableElementInWriteArea) ? this.view.getFocusableElementInWriteArea(this.ui.writeArea) : this.ui.writeArea.find(TabablesBehavior.focusablesSelector).filter(":visible:not([disabled])");
      var index = tabableElements.index(currentEl), focusableElIndex;
      if (tabableElements.length <= 1) {
        return;
      }
      if (isShift) {
        if (index === 0) {
          focusableElIndex = tabableElements.length - 1;
        } else {
          focusableElIndex = index - 1;
        }
      } else {
        if (index === tabableElements.length - 1) {
          focusableElIndex = 0;
        } else {
          focusableElIndex = index + 1;
        }
      }
      return tabableElements.get(focusableElIndex);
    },
    onFieldValueChange: function(currentValue) {
      var valueChanged = true;
      if (currentValue instanceof Backbone.Model && this.view.oldVal && this.view.oldVal.get("id") === currentValue.get("id") || _.isString(currentValue) && this.view.oldVal === currentValue) {
        valueChanged = false;
      }
      if (valueChanged) {
        this.enableSaveButton();
      } else {
        this.disableSaveButton();
      }
    },
    onFormInteractionPerformed: function($interactedEl) {
      if (this.isEditMode === true && $interactedEl && !$.contains(this.view.$el[0], $interactedEl[0])) {
        this.revertFieldChanges(true);
      }
    },
    onMouseOutRead: function() {
      if (!this.hasReadFocus()) {
        this._hideEditIcon();
      }
    },
    onMouseOverRead: function() {
      this._showEditIcon();
    },
    onFocusOutEdit: function() {
      this._hideEditIcon();
    },
    onFocusInEdit: function() {
      this._showEditIcon();
    },
    onKeyupInRead: function(event) {
      if (event.keyCode === 13) {
        this.setViewStateWriteAndEnterEditMode();
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onKeyUpForEsc: function(event) {
      if (event.keyCode === 27) {
        this.revertFieldChanges();
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onKeyWrite: function(event) {
      if (event.keyCode === 13) {
        this.checkAndsaveFieldChanges();
        event.preventDefault();
        event.stopPropagation();
      }
    },
    revertFieldChanges: function(ignoreEditFocus) {
      this.isEditMode = false;
      this.view.revertFieldChanges();
      this.setViewReadOnlyAndLeaveEditMode();
      if (!ignoreEditFocus) {
        this.ui.editIcon.trigger("focus");
      }
    },
    checkAndsaveFieldChanges: function() {
      var self = this;
      this.view.saveFieldChanges().done(function() {
        self.setViewReadOnlyAndLeaveEditMode();
        self.ui.editIcon.trigger("focus");
      });
    },
    onMouseDownWrite: function(event) {
      if (this.view.ignoreWriteMouseDownEvent) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    },
    enableSaveButton: function() {
      this.ui.saveIcon.removeAttr("disabled");
    },
    disableSaveButton: function() {
      this.ui.saveIcon.attr("disabled", true);
    }
  });
  return D2FieldEditableBehavior;
});