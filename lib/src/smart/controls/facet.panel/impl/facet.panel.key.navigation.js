/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery" ], function(_, $) {
  "use strict";
  var KeyEventNavigation = {
    onSetNextChildFocus: function(childView) {
      this.activeChildIndex = childView.getIndex();
    },
    accActivateTabableRegion: function() {
      $(document).unbind("mousedown", this._onRemoveKeyboardFocus);
      $(document).bind("mousedown", this._onRemoveKeyboardFocus);
    },
    _removeKeyboardFocus: function() {
      this.$el.find(".csui-focus").removeClass("csui-focus");
      $(document).unbind("mousedown", this._onRemoveKeyboardFocus);
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode;
      var retVal = false;
      switch (keyCode) {
       case 38:
       case 33:
        var prevChild = this._getPrevActiveChild();
        prevChild.trigger("focus");
        break;

       case 40:
       case 34:
        var nextChild = this._getNextActiveChild();
        nextChild.trigger("focus");
        break;

       default:
        return true;
      }
      return retVal;
    },
    resetFacetFocus: function(childView) {
      childView.$el.trigger("focus");
    },
    _getNextActiveChild: function() {
      var childNodes = this.$childViewContainer[0].childNodes;
      if (childNodes.length - 1 > this.activeChildIndex) {
        this.activeChildIndex++;
      } else {
        this.activeChildIndex = 0;
      }
      return $(childNodes[this.activeChildIndex]);
    },
    _getPrevActiveChild: function() {
      var childNodes = this.$childViewContainer[0].childNodes;
      if (this.activeChildIndex > 0) {
        this.activeChildIndex--;
      } else {
        this.activeChildIndex = childNodes.length - 1;
      }
      return $(childNodes[this.activeChildIndex]);
    }
  };
  return KeyEventNavigation;
});