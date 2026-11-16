/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "csui/controls/list/emptylist.view", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/dialogs/modal.alert/modal.alert", "hbs!dctmw/controls/list/impl/sortable.list", "hbs!dctmw/controls/list/impl/sortable.list.item", "i18n!dctmw/controls/list/impl/nls/lang", "css!dctmw/controls/list/impl/sortable.list.css" ], function(_, $, Marionette, EmptyListView, PerfectScrollingBehavior, Alert, listTemplate, listItemTemplate, lang) {
  "use strict";
  var SortableListItemView = Marionette.LayoutView.extend({
    template: listItemTemplate,
    className: "sub-item",
    regions: {
      sub_item_container: "> .sub-item-container"
    },
    ui: {
      sub_item_container: "> .sub-item-container",
      remove_button: "> .remove-button"
    },
    events: {
      "click @ui.remove_button": "removeButtonClick"
    },
    constructor: function SortableListItemView(options) {
      options = options || {};
      this.subItemView = options.itemView;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.listView = this.options.listView;
      this.$el.attr("draggable", true);
      if (this.model.get("selected")) {
        this.$el.addClass("newly-added");
      }
    },
    onBeforeShow: function() {
      this.showChildView("sub_item_container", new this.subItemView({
        model: this.model,
        itemIndex: this.getOption("itemIndex"),
        parentView: this.options.parentView
      }));
      if (this.listView && this.listView.options && this.listView.options.hasNonRemovableItem && this.listView.options.isItemNonRemovable && _.isFunction(this.listView.options.isItemNonRemovable)) {
        if (this.listView.options.isItemNonRemovable(this.model)) {
          this.ui.sub_item_container.addClass(this.listView.focusableElementClass);
          this.$el.addClass("non-removable-item");
        } else {
          this.ui.remove_button.addClass(this.listView.focusableElementClass);
        }
      }
    },
    removeButtonClick: function() {
      var me = this, parentCollection = me.getOption("parentCollection");
      if (parentCollection.length === 1 && !this.options.deleteAll) {
        Alert.showError(function() {
          me.ui.remove_button.trigger("focus");
        }, lang.SortableListLastColumnMandatory);
        return;
      }
      parentCollection.remove(me.model);
    }
  });
  var SortableListView = Marionette.CompositeView.extend({
    template: listTemplate,
    childViewContainer: "> .d2-sortable-list > .binf-list-group",
    childView: SortableListItemView,
    childViewOptions: function(model) {
      return {
        itemView: this.options.itemView,
        itemIndex: this.collection.indexOf(model),
        parentCollection: this.collection,
        parentView: this.options.parentView,
        listView: this
      };
    },
    emptyView: EmptyListView,
    events: {
      keydown: "onKeyDown",
      "focus .sub-item": "onItemFocus",
      "blur .sub-item": "onItemBlur"
    },
    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".binf-list-group",
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },
    constructor: function SortableListView(options) {
      options = options || {};
      Marionette.CompositeView.prototype.constructor.call(this, options);
      this.listenTo(this, "set:focus", this.onSetFocus.bind(this));
      this._setFocusableElementClass();
    },
    attachHtml: function(collectionView, childView, index) {
      Marionette.CompositeView.prototype.attachHtml.call(this, collectionView, childView, index);
      this.attachDragListeners(childView);
    },
    attachDragListeners: function(childView) {
      var me = this, subItem = childView.$el, removeDragline = function() {
        me.$el.find(".csui-dragline").remove();
        delete me._dropAfter;
      };
      subItem.on("dragstart", function(event) {
        me._dragData = {
          sourceKey: me._getItemKey($(event.currentTarget))
        };
        event.originalEvent.dataTransfer.setData("text/plain", null);
      });
      subItem.on("dragover", function(event) {
        if (!me._dragData || me._dragData.sourceKey === undefined) {
          return;
        }
        event.preventDefault();
        var dragline = $('<div class="csui-dragline">');
        var h = $(event.currentTarget).height();
        if (event.offsetY > h / 2) {
          if (me._dropAfter === undefined || me._dropAfter === false) {
            removeDragline();
            $(event.currentTarget).after(dragline);
            me._dropAfter = true;
          }
        } else {
          if (me._dropAfter === undefined || me._dropAfter === true) {
            removeDragline();
            $(event.currentTarget).before(dragline);
            me._dropAfter = false;
          }
        }
      });
      subItem.on("drop", function(event) {
        if (!me._dragData || me._dragData.sourceKey === undefined) {
          return;
        }
        var sourceKey = me._dragData.sourceKey, targetKey = me._getItemKey($(event.currentTarget)), sourceModel = me.collection.get(sourceKey), targetModel = me.collection.get(targetKey), sourceIndex = me.collection.indexOf(sourceModel), targetIndex = me.collection.indexOf(targetModel);
        event.preventDefault();
        if (me._dropAfter === true) {
          targetIndex++;
        }
        if (sourceIndex < targetIndex) {
          targetIndex--;
        }
        if (sourceIndex === targetIndex) {
          return;
        }
        me.collection.remove(sourceModel);
        me.collection.add(sourceModel, {
          at: targetIndex
        });
        me.collection.trigger("reorder", {
          model: sourceModel
        });
        me.triggerMethod("reorder", sourceModel);
        removeDragline();
      });
      subItem.on("dragleave", function() {
        removeDragline();
      });
      subItem.on("dragend", function(event) {
        event.preventDefault();
        removeDragline();
        delete me._dragData;
      });
    },
    onSetFocus: function() {
      this._setFocus(this.currentFocusElem || this._getFirstElement());
    },
    onItemFocus: function(event) {
      var target = $(event.target);
      if (target.hasClass(this.focusableElementClass)) {
        this.currentFocusElem = target.parent();
        this.currentFocusElem.removeClass("select");
        this.currentFocusElem.addClass("focus");
      } else {
        this.currentFocusElem = target;
        this.currentFocusElem.removeClass("focus");
        this.currentFocusElem.addClass("select");
      }
    },
    onItemBlur: function() {
      var target = $(event.target);
      if (target.hasClass(this.focusableElementClass)) {
        $(event.target).parent().removeClass("focus");
      } else {
        $(event.target).removeClass("select");
      }
    },
    deleteItem: function(preElem) {
      var newFocus = this._getNextElement(preElem), focusableClass = "." + this.focusableElementClass;
      if (newFocus.length === 0) {
        newFocus = this._getPrevElement(preElem);
      }
      preElem.find(focusableClass).trigger("click");
      if (newFocus.length > 0) {
        this._setFocus(newFocus);
      } else {
        this.trigger("lost:focus", true);
      }
    },
    executeAction: function(preElem) {
      this.deleteItem(preElem);
    },
    executeDelete: function(preElem) {
      this.deleteItem(preElem);
    },
    onKeyDown: function(event) {
      var me = this, prev, next, preElem = me.currentFocusElem;
      if (!preElem || preElem.length === 0) {
        return;
      }
      if (me.keyboardReorderMode === true) {
        switch (event.which) {
         case 33:
         case 36:
          me._moveItemToTop(preElem);
          break;

         case 34:
         case 35:
          me._moveItemToBottom(preElem);
          break;

         case 38:
          me._moveItemUp(preElem);
          break;

         case 40:
          me._moveItemDown(preElem);
          break;

         case 27:
          me._revertItemMove(preElem);
          break;

         case 13:
          me._commitItemMove(preElem);
          break;

         case 9:
          break;

         case 46:
          break;

         default:
          return;
        }
      } else {
        switch (event.which) {
         case 33:
         case 36:
          me._setFocus(me._getFirstElement(), preElem);
          break;

         case 34:
         case 35:
          me._setFocus(me._getLastElement(), preElem);
          break;

         case 38:
          prev = me._getPrevElement(preElem);
          if (prev.length > 0) {
            me._setFocus(prev, preElem);
          }
          break;

         case 40:
          next = me._getNextElement(preElem);
          if (next.length > 0) {
            me._setFocus(next, preElem);
          }
          break;

         case 9:
          me.trigger("lost:focus", event.shiftKey);
          break;

         case 13:
          me.executeAction(preElem);
          break;

         case 32:
          if (event.ctrlKey === true) {
            me.keyboardReorderMode = true;
            me._setFocus(preElem);
          } else {
            me.executeAction(preElem);
          }
          break;

         case 46:
          me.executeDelete(preElem);
          break;

         default:
          return;
        }
      }
      event.preventDefault();
      event.stopPropagation();
    },
    _getItemKey: function(el) {
      return el.find("[data-d2-key]").attr("data-d2-key");
    },
    _getFirstElement: function() {
      return this.$el.find(".sub-item:first");
    },
    _getLastElement: function() {
      return this.$el.find(".sub-item:last");
    },
    _getPrevElement: function(preElem) {
      return preElem.prev(".sub-item");
    },
    _getNextElement: function(preElem) {
      return preElem.next(".sub-item");
    },
    _setFocus: function(elem, preElem) {
      var me = this, focusableClass = "." + me.focusableElementClass;
      setTimeout(function() {
        if (preElem) {
          preElem.removeAttr("tabindex");
          preElem.find(focusableClass).removeAttr("tabindex");
        }
        if (elem) {
          if (me.keyboardReorderMode === true) {
            elem.attr("tabindex", "0") && elem.trigger("focus");
          } else {
            var btn = elem.find(focusableClass);
            btn.attr("tabindex", "0") && btn.trigger("focus");
          }
        }
      }, 50);
    },
    _moveItemToTop: function(preElem) {
      preElem.insertBefore(this._getFirstElement());
      this._setFocus(preElem);
    },
    _moveItemToBottom: function(preElem) {
      preElem.insertAfter(this._getLastElement());
      this._setFocus(preElem);
    },
    _moveItemUp: function(preElem) {
      var prev = this._getPrevElement(preElem);
      if (prev.length > 0) {
        preElem.insertBefore(prev);
        this._setFocus(preElem);
      }
    },
    _moveItemDown: function(preElem) {
      var next = this._getNextElement(preElem);
      if (next.length > 0) {
        preElem.insertAfter(next);
        this._setFocus(preElem);
      }
    },
    _revertItemMove: function(preElem) {
      delete this.keyboardReorderMode;
      var sourceModel = this.collection.get(this._getItemKey(preElem)), idx = this.collection.indexOf(sourceModel), parent = preElem.parent();
      preElem.detach();
      if (idx === 0) {
        preElem.prependTo(parent);
      } else {
        preElem.insertAfter(parent.find(".sub-item:nth-child(" + idx + ")"));
      }
      this._setFocus(preElem);
    },
    _commitItemMove: function(preElem) {
      delete this.keyboardReorderMode;
      var sourceModel = this.collection.get(this._getItemKey(preElem)), idx = this.$el.find(".sub-item").index(preElem), parent = preElem.parent();
      this.collection.remove(sourceModel);
      this.collection.add(sourceModel, {
        at: idx
      });
      this.collection.trigger("reorder", {
        model: sourceModel
      });
      this._setFocus(parent.find(".sub-item:nth-child(" + (idx + 1) + ")"));
      this.triggerMethod("reorder", sourceModel);
    },
    _setFocusableElementClass: function() {
      this.focusableElementClass = this.options.hasNonRemovableItem ? "sub-item-focusable-element" : "remove-button";
    }
  });
  return SortableListView;
});