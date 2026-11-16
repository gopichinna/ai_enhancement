/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/jquery", "nuc/lib/marionette", "nuc/lib/backbone", "smart/utils/smart.base", "smart/controls/node.picker/impl/node.list/np.list.view", "smart/controls/node.picker/impl/node.list/grid.item.view", "smart/controls/progressblocker/blocker", "smart/controls/emptylist/emptylist.view", "i18n!smart/controls/node.picker/impl/nls/lang", "css!smart/controls/node.picker/impl/node.list/node.list", "css!smart/controls/node.picker/impl/node.list/node.grid" ], function(_, $, Marionette, Backbone, smartbase, NPListView, GridItem, BlockingView, EmptyListView, npLang) {
  "use strict";
  var NodeGridView = NPListView.extend({
    emptyView: EmptyListView,
    emptyViewOptions: function() {
      return {
        text: npLang.noSearchResultMessage,
        gridView: this.options?.masterView?.isGridView()
      };
    },
    childView: GridItem,
    constructor: function NodeGridView(options = {}) {
      this.options = options;
      NPListView.prototype.constructor.apply(this, arguments);
    },
    onRender: function() {
      if (this.options?.commandType?.multiSelect) {
        this.$el.find(".list-content .binf-list-group").attr("aria-multiselectable", true);
        this.options?.masterView?.trigger("update:checkbox", {
          modelId: ""
        });
      }
    },
    calculateColumns: function() {
      const gridElement = this.el?.querySelector(".binf-list-group");
      const gridStyles = getComputedStyle(gridElement);
      const gridTemplateColumns = gridStyles?.getPropertyValue("grid-template-columns")?.split(" ")?.length;
      return gridTemplateColumns;
    },
    onKeyInView: function(event) {
      var keyCode = event.keyCode, focusables = this._getFocusables(), moved = false;
      switch (keyCode) {
       case 9:
        this.$el.trigger("tabNextRegion");
        break;

       case 38:
       case 40:
        const columns = this.calculateColumns();
        if (document.activeElement.closest(".csui-has-inlineform")) {
          moved = false;
          event.preventDefault();
        } else {
          if (keyCode === 38) {
            if (this.focusIndex >= columns) {
              this.focusIndex -= columns;
            }
            moved = true;
          } else {
            const maxRows = Math.ceil(focusables.length / columns);
            const currentIndexInRow = this.focusIndex % columns;
            const currentRowIndex = Math.floor(this.focusIndex / columns);
            if (currentRowIndex < maxRows - 1) {
              const nextRowFocusIndex = (currentRowIndex + 1) * columns + currentIndexInRow;
              if (nextRowFocusIndex < focusables.length) {
                this.focusIndex = nextRowFocusIndex;
              }
              moved = true;
            }
          }
        }
        break;

       case 37:
       case 39:
        if (document.activeElement.closest(".csui-has-inlineform")) {
          moved = false;
        } else {
          if (smartbase.isRTL()) {
            if (keyCode === 39) {
              this.focusIndex > 0 && --this.focusIndex;
            } else {
              this.focusIndex < focusables.length - 1 && ++this.focusIndex;
            }
          } else if (keyCode === 37) {
            this.focusIndex > 0 && --this.focusIndex;
          } else {
            this.focusIndex < focusables.length - 1 && ++this.focusIndex;
          }
          moved = true;
        }
        break;

       case 35:
        this.focusIndex = this.collection.length - 1;
        moved = true;
        break;

       case 36:
        this.focusIndex = 0;
        moved = true;
        break;
      }
      if (moved) {
        event.preventDefault();
        this.trigger("changed:focus");
        var focusableEle;
        if (focusables[this.focusIndex]?.classList.contains("csui-has-inlineform")) {
          focusableEle = focusables[this.focusIndex]?.querySelector(".smart-edit-input-name");
        } else {
          focusableEle = focusables[this.focusIndex];
        }
        focusableEle.focus();
      }
    }
  });
  return NodeGridView;
});