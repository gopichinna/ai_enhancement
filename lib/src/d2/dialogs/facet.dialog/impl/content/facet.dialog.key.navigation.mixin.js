/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

export default {
  mixin: function(prototype) {
    return _.extend(prototype, {
      _resetPosition: function() {
        this.activeChild = null;
        this._activeRowIdx = 0;
        this._activeColumnIdx = 0;
      },
      currentlyFocusedElement: function() {
        if (this.collection.length === 0) {
          return null;
        }
        this.prevChild = this._getChild(0, 0)?.$el;
        return this.prevChild;
      },
      getActiveChildView: function() {
        if (!this.activeChild) {
          this._resetPosition();
          if (this.collection.length) {
            this._activeChildItem = this.columnCollectionView.$(".d2-facet-item:first");
          }
        }
        return this.activateChild;
      },
      onKeyInView: function(event) {
        let child = null;
        switch (event.keyCode) {
         case 37:
          child = this._getChild(0, -1);
          break;

         case 38:
          child = this._getChild(-1, 0);
          break;

         case 39:
          child = this._getChild(0, 1);
          break;

         case 40:
          child = this._getChild(1, 0);
          break;

         case 13:
         case 32:
          child = this._getChild(0, 0);
          child.$el.find("input").trigger("click");
          break;
        }
        if (child) {
          this.prevChild?.attr("tabindex", -1);
          this.prevChild?.removeClass("csui-focus");
          this.prevChild = child.$el;
          child.$el.addClass("csui-focus");
          child.$el.trigger("focus");
        }
      },
      _getChild: function(upDown, leftRight) {
        this._activeColumnIdx = Math.max(0, this._activeColumnIdx + leftRight);
        this._activeRowIdx = Math.max(0, this._activeRowIdx + upDown);
        let columnsCount = this.columnCollectionView.children.length;
        if (this._activeColumnIdx >= columnsCount) {
          this._activeColumnIdx = columnsCount - 1;
        }
        let column = this.columnCollectionView.children.findByIndex(this._activeColumnIdx);
        if (column.children.length <= this._activeRowIdx) {
          this._activeRowIdx = column.children.length - 1;
        }
        this.$(".d2-facet-item").attr("tabindex", -1);
        return column.children.findByIndex(this._activeRowIdx);
      }
    });
  }
};