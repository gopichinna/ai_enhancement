/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette" ], function(_, $, Marionette) {
  "use strict";
  var ListKeyboardBehavior = Marionette.Behavior.extend({
    events: {
      keydown: "onKeyDown"
    },
    defaults: {
      focusActivationTimeoutInMS: 50
    },
    constructor: function ListKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      view.keyboardBehavior = this;
      this.listenTo(view, "click:item", this._onClickItem);
    },
    onShow: function() {
      this.refreshFocusableElement();
    },
    onRenderCollection: function() {
      this.refreshFocusableElement();
    },
    _onClickItem: function(item) {
      var selIndex = this.focusedIndex;
      var focusedElem = this.view.selectedIndexElem(selIndex);
      focusedElem && focusedElem.prop("tabindex", "-1");
      this.focusedIndex = this.view.collection.indexOf(item.model);
      item.$el.prop("tabindex", "0");
    },
    onKeyDown: function(event) {
      var focusIndex = this.focusedIndex;
      if (focusIndex < 0 || focusIndex === undefined) {
        focusIndex = this.view.getSelectedIndex();
      }
      var $prevElem = this.view.selectedIndexElem(focusIndex);
      switch (event.keyCode) {
       case 33:
        this._moveFocusTo(event, this._pickFirst(), $prevElem);
        break;

       case 34:
        this._moveFocusTo(event, this._pickLast(), $prevElem);
        break;

       case 38:
        this._moveFocusTo(event, this._pickPrevious(), $prevElem);
        break;

       case 40:
        this._moveFocusTo(event, this._pickNext(), $prevElem);
        break;

       case 13:
       case 32:
        event.preventDefault();
        event.stopPropagation();
        this.makeItemSelectedAtIndex(this.focusedIndex);
        break;
      }
    },
    _pickFirst: function() {
      this.focusedIndex = 0;
      return this.view.selectedIndexElem(this.focusedIndex);
    },
    _pickLast: function() {
      this.focusedIndex = this.view.collection.length - 1;
      return this.view.selectedIndexElem(this.focusedIndex);
    },
    _pickNext: function() {
      if (this.focusedIndex < 0 || this.focusedIndex === undefined) {
        this.focusedIndex = this.view.getSelectedIndex();
      }
      if (this.focusedIndex < this.view.collection.length - 1) {
        this.focusedIndex++;
      }
      return this.view.selectedIndexElem(this.focusedIndex);
    },
    _pickPrevious: function() {
      if (this.focusedIndex < 0 || this.focusedIndex === undefined) {
        this.focusedIndex = this.view.getSelectedIndex();
      }
      if (this.focusedIndex > 0) {
        this.focusedIndex--;
      }
      return this.view.selectedIndexElem(this.focusedIndex);
    },
    makeItemSelectedAtIndex: function(index) {
      if (index >= this.view.collection.length || index < 0) {
        return;
      }
      var $elem = this.view.selectedIndexElem(index);
      $elem && $elem.trigger("click");
    },
    _moveFocusTo: function(event, $target, $prevElem) {
      event.preventDefault();
      event.stopPropagation();
      setTimeout(function() {
        $prevElem && $prevElem.prop("tabindex", "-1");
        $target.prop("tabindex", "0");
        $target.trigger("focus");
      }, this.options.focusActivationTimeoutInMS);
    },
    refreshFocusableElement: function() {
      this.focusedIndex = this.view.getSelectedIndex();
      if (this.focusedIndex < 0 || this.focusedIndex === undefined) {
        this.focusedIndex = 0;
      }
      var focusedElem = this.view.selectedIndexElem(this.focusedIndex);
      if (focusedElem) {
        focusedElem.siblings().prop("tabindex", "-1");
        focusedElem.prop("tabindex", "0");
      }
    }
  });
  return ListKeyboardBehavior;
});