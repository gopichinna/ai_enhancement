/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/base", "csui/controls/tile/behaviors/perfect.scrolling.behavior", "csui/behaviors/keyboard.navigation/tabable.region.behavior", "d2/utils/constants", "dctmw/controls/list/sortable.list.view", "d2/controls/multi.item/impl/item.view" ], function(_, $, Backbone, Marionette, base, PerfectScrollingBehavior, TabableRegionBehavior, constants, SortableListView, ItemView) {
  "use strict";
  var ItemSelectView = SortableListView.extend({
    className: "list",
    constructor: function ItemSelectView() {
      this.behaviors = _.extend(this.behaviors, {
        TabableRegion: {
          behaviorClass: TabableRegionBehavior
        }
      });
      SortableListView.prototype.constructor.apply(this, arguments);
      this.multiItemView = this.options.multiItemView;
      this.listenTo(this, "childview:click", this.onClickChildItem);
    },
    childView: function() {},
    buildChildView: function(child, ChildViewClass, childViewOptions) {
      var options = _.extend({
        model: child
      }, childViewOptions);
      var view;
      if (this.options.itemViewClass) {
        view = new this.options.itemViewClass(options);
      } else {
        view = new ItemView(options);
      }
      return view;
    },
    childViewOptions: function() {
      return _.extend({
        itemSelectView: this
      }, this.options);
    },
    onRender: function() {
      var self = this;
      self.updateReorderState();
      if (this.collection.length > 0) {
        var firstItemView = this.multiItemView.showFirstItem();
        setTimeout(function() {
          self.multiItemView.showItemPosition(firstItemView);
        }, 500);
      }
    },
    highlightSelectedView: function(item) {
      this.children.forEach(function(view) {
        view.ui.itemInfo.removeClass("selected-item");
        view.ui.itemInfo.attr("tabindex", -1);
      });
      item.ui.itemInfo.addClass("selected-item");
      item.ui.itemInfo.attr("tabindex", 0);
      this.trigger("refresh:tabindexes");
      item.ui.itemInfo.trigger("focus");
    },
    onClickChildItem: function(itemView) {
      this.multiItemView.changeViewInItemDetails(itemView, true);
    },
    currentlyFocusedElement: function() {
      return this.$el.find(".selected-item")[0];
    },
    updateReorderState: function() {
      if (this.options.enableReorder && this.collection.length > 1) {
        this.$el.addClass("sortable-list");
        this.$el.find(".sub-item").attr("draggable", true);
        return true;
      } else {
        this.$el.removeClass("sortable-list");
        this.$el.find(".sub-item").attr("draggable", false);
        return false;
      }
    },
    onReorder: function(itemModel, isKeyboardEvent) {
      var reorderedItemView = this.children.findByModel(itemModel);
      var isCurrentItem = false;
      this.multiItemView.removeCopyReference();
      if (itemModel.cid === this.multiItemView.getSelectedItemModel().cid) {
        reorderedItemView.ui.itemInfo.addClass("selected-item");
        isCurrentItem = true;
      }
      this.multiItemView.trigger("item:reorder", itemModel, isCurrentItem);
      var firstItemModel = this.collection.at(0);
      if (firstItemModel.get("itemState") === constants.ItemStates.NOT_VISITED) {
        firstItemModel.set("itemState", constants.ItemStates.NOT_VALIDATED);
      }
      if (isKeyboardEvent) {
        reorderedItemView.ui.itemInfo.trigger("focus");
      }
    },
    attachHtml: function(collectionView, childView, index) {
      Marionette.CompositeView.prototype.attachHtml.call(this, collectionView, childView, index);
      if (this.options.enableReorder) {
        this.attachDragListeners(childView);
      }
    },
    onItemFocus: function(event) {
      var target = $(event.target);
      if (target.hasClass("item-info")) {
        this.currentFocusElem = target.closest(".sub-item");
        this.currentFocusElem.removeClass("select");
        this.currentFocusElem.addClass("focus");
      } else {
        this.currentFocusElem = target;
        this.currentFocusElem.removeClass("focus");
        this.currentFocusElem.addClass("select");
      }
    },
    onItemBlur: function(event) {
      var target = $(event.target);
      if (target.hasClass("item-info")) {
        target.closest(".sub-item").removeClass("focus");
      } else {
        target.removeClass("select");
      }
      this.checkBlurEventOnReorder(event);
    },
    onKeyDown: function(event) {
      var me = this, preElem = me.currentFocusElem;
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
         case 32:
          if (event.ctrlKey === true) {
            me.keyboardReorderMode = true;
            me._setFocus(preElem);
          }
          break;

         default:
          return;
        }
      }
      event.preventDefault();
      event.stopPropagation();
    },
    checkBlurEventOnReorder: function(event) {
      if (this.keyboardReorderMode && event.relatedTarget) {
        var $target = $(event.currentTarget), $relatedTarget = $(event.relatedTarget);
        if (!$relatedTarget.is($target)) {
          var $event = $.Event("keydown");
          $event.which = 27;
          $target.trigger($event);
        }
      }
    }
  });
  return ItemSelectView;
});