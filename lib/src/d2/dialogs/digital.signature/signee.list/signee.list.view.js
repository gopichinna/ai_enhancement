/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "d2/dialogs/digital.signature/signee.list/signee.item.view", "d2/dialogs/digital.signature/signee.list/signee.list.empty.view" ], function($, _, Backbone, Marionette, SigneeItemView, SigneeListEmptyView) {
  "use strict";
  var stopEvent = function(event) {
    event.stopPropagation();
    event.preventDefault();
  };
  return Marionette.CollectionView.extend({
    className: "signature-signee-list",
    childView: SigneeItemView,
    events: {
      keydown: "onKeyDownSigneeList"
    },
    emptyView: SigneeListEmptyView,
    emptyViewOptions: function() {
      return {
        message: this.options.emptyViewMessage
      };
    },
    childViewOptions: function() {
      return {
        context: this.options.context,
        signeeListView: this,
        groupIndex: this.options.groupIndex,
        allowDragAndDrop: this.options.allowDragAndDrop,
        removeTabIndex: this.options.removeTabIndex
      };
    },
    constructor: function SigneeListView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.options.hideEmptyView && (this.emptyView = false);
    },
    getElementByIndex: function(index) {
      if (isNaN(index) || index < 0 || index >= this.collection.length) {
        return null;
      }
      var items = this.$el.find(".signature-signee > .signee-item");
      return $(items[index]);
    },
    getIndexByElement: function(element) {
      if (!element || !element.length) {
        return null;
      }
      var index = null, items = this.$el.find(".signature-signee > .signee-item");
      _.find(items, function(item, i) {
        if (item === element[0] || item === element[0].parentElement) {
          index = i;
        }
      });
      return index;
    },
    onKeyDownSigneeList: function(event) {
      var selectedIndex = this.getIndexByElement(this.$el.find(":focus")) || 0, previousElement = this.getElementByIndex(selectedIndex);
      switch (event.which) {
       case 33:
       case 36:
        this._changeFocus(this.getElementByIndex(0), previousElement);
        stopEvent(event);
        break;

       case 34:
       case 35:
        this._changeFocus(this.getElementByIndex(this.collection.length - 1), previousElement);
        stopEvent(event);
        break;

       case 40:
        this._changeFocus(this.getElementByIndex(selectedIndex + 1), previousElement);
        stopEvent(event);
        break;

       case 38:
        this._changeFocus(this.getElementByIndex(selectedIndex - 1), previousElement);
        stopEvent(event);
        break;
      }
    },
    _changeFocus: function(nextElement, previousElement) {
      if (nextElement && nextElement !== previousElement) {
        nextElement.prop("tabindex", "0");
        nextElement.trigger("focus");
        previousElement.removeAttr("tabindex");
      }
    }
  });
});