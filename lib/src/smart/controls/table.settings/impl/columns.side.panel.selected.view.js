/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "smart/controls/table.settings/impl/keyboard.navigation.mixin", "smart/controls/table.settings/impl/columns.side.panel.content.item.view", "css!smart/controls/table.settings/impl/columns.side.panel.selected" ], function(module, _, Backbone, Marionette, logUtil, KeyboardNavigationMixin, ColumnsItemView) {
  const log = logUtil(module.id);
  const ColumnsSidePanelSelectedView = Marionette.CollectionView.extend({
    childView: ColumnsItemView,
    className: "smart-table-settings-columns-view",
    tagName: "ol",
    events: {
      keydown: "onKeyInView"
    },
    childEvents: {
      "click:item": "onClickItem",
      "enter:item": "onEnterItem",
      "move:up": "moveItemUp",
      "move:down": "moveItemDown",
      "remove:item": "removeItem",
      "dragover:item": "dragoverItem",
      "drop:item": "dropItem",
      "dragend:item": "dragendItem"
    },
    constructor: function ColumnsSidePanelSelectedView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.options || (this.options = {});
      this.allColumnsCollection = this.options.allColumns;
      this.collection = new Backbone.Collection();
      this._resetViewCollectionFromSelectedColumns();
      this._boundDocumentClickHandler = this._handleDocumentClick.bind(this);
      this._initializeKN();
      if (this.collection.length === 0) {
        this.resetToDefaults();
      }
    },
    _clearCssMarker: function(model) {
      model.set({
        dragstart: false,
        dragover: ""
      });
    },
    _clearCssMarkers: function() {
      this.collection.each(model => {
        this._clearCssMarker(model);
      });
    },
    dragoverItem: function(itemView, event) {
      const itemModel = itemView.model;
      const pinned = itemModel.get("pinned");
      const permanentAtEnd = itemModel.get("permanentAtEnd");
      if (!(pinned && permanentAtEnd)) {
        event.preventDefault();
        let index = this._indexFromItemView(itemView);
        const height = itemView.el.offsetHeight;
        const y = event.originalEvent.offsetY;
        if (y < height / 2) {
          if (index > 0) {
            const prevModel = this.collection.at(index - 1);
            prevModel.set("dragover", "bottom");
            itemModel.set("dragover", "");
          } else {
            itemModel.set("dragover", "top");
          }
        } else {
          itemModel.set("dragover", "bottom");
          if (index > 0) {
            const prevModel = this.collection.at(index - 1);
            prevModel.set("dragover", "");
          }
        }
      }
    },
    dragendItem: function(itemView, event) {
      this._clearCssMarkers();
    },
    dropItem: function(itemView, event) {
      const id = event.originalEvent.dataTransfer.getData("text/plain");
      if (id === "") {
        return;
      }
      event.preventDefault();
      const sourceIndex = this._indexOfItemById(id);
      let targetIndex = this._indexFromItemView(itemView);
      if (targetIndex !== undefined && targetIndex > 0) {
        const height = itemView.el.offsetHeight;
        const y = event.originalEvent.offsetY;
        if (y >= height / 2) {
          targetIndex++;
        }
        if (sourceIndex < targetIndex) {
          targetIndex--;
        }
        const modelToRemove = this.collection.get(id);
        this._renderingCollection = true;
        const removedModel = this.collection.remove(modelToRemove);
        this.collection.add(removedModel, {
          at: targetIndex
        });
        this._renderingCollection = false;
        this._markFirstAndLastMovable();
        const droppedItemView = this.children.findByModel(removedModel);
        this.knSetCurrentlyFocusedViewIdentifier(droppedItemView);
        const knViewInfos = this.knGetKnViewsSorted();
        this.knUpdateTabStops(knViewInfos);
        droppedItemView.knNavigateToThisView();
        setTimeout(() => {
          this.collection.each(model => {
            if (model.get("id") === id) {
              model.set({
                dragstart: false,
                dragover: ""
              });
            } else {
              model.set({
                dragstart: false,
                dragover: ""
              });
            }
          });
        }, 0);
      } else {
        this._clearCssMarkers();
      }
    },
    _prepareColumnsData: function(collection) {
      return collection.map(columnModel => {
        const isPinned = columnModel.get("pinned");
        const isPermanent = columnModel.get("permanent");
        const isPermanentAtEnd = columnModel.get("isPermanentAtEnd");
        const modelData = {
          fixed: !!(isPinned || isPermanent || isPermanentAtEnd)
        };
        for (const key in columnModel.attributes) {
          if (columnModel.attributes.hasOwnProperty(key)) {
            modelData[key] = columnModel.get(key);
          }
        }
        return modelData;
      });
    },
    _resetViewCollectionFromSelectedColumns: function() {
      const selectedColumns = this.options.selectedColumns.map(columnModel => {
        const id = columnModel.get("id");
        const model = this.allColumnsCollection.get(id);
        return model;
      });
      this.collection.reset(this._prepareColumnsData(selectedColumns));
    },
    _getDefaultColumns: function() {
      const pinnedColumns = this.allColumnsCollection.where({
        pinned: true
      });
      const alwaysSelectedColumns = this.allColumnsCollection.filter(model => {
        const isPermanent = model.get("permanent");
        const isDefault = model.get("default");
        return isPermanent || isDefault;
      });
      return new Backbone.Collection(pinnedColumns.concat(alwaysSelectedColumns));
    },
    resetToDefaults: function() {
      const selectedColumns = this._getDefaultColumns();
      this.collection.reset(this._prepareColumnsData(selectedColumns));
    },
    getSelectedColumns: function() {
      return this.collection.map(viewModel => {
        const id = viewModel.get("id");
        return this.allColumnsCollection.get(id);
      });
    },
    areSelectedColumnsDefault: function() {
      const defaultColumnHash = this.getDefaultColumnsHash();
      const selectedColumnsHash = this.getCurrentlySelectedColumnsHash();
      return defaultColumnHash === selectedColumnsHash;
    },
    applyChanges: function() {
      this.options.selectedColumns.reset(this.getSelectedColumns(), {
        isResetToDefault: this.areSelectedColumnsDefault()
      });
    },
    setCurrentSelectedColumns: function(editedSelectedColumnsCollection) {
      const currentSelectedColumns = [];
      const columnsPermanentAtEnd = [];
      this.collection.each(selectedColumnsModel => {
        if (selectedColumnsModel.get("permanentAtEnd")) {
          columnsPermanentAtEnd.push(selectedColumnsModel);
          return;
        }
        const id = selectedColumnsModel.get("id");
        const model = editedSelectedColumnsCollection.get(id);
        if (model) {
          currentSelectedColumns.push(selectedColumnsModel);
        }
      });
      editedSelectedColumnsCollection.each(editedSelectedColumnModel => {
        const id = editedSelectedColumnModel.get("id");
        const model = this.collection.get(id);
        if (!model) {
          currentSelectedColumns.push(editedSelectedColumnModel);
        }
      });
      this.collection.reset(currentSelectedColumns.concat(columnsPermanentAtEnd));
    },
    getDefaultColumnsHash() {
      const defaultColumns = this._getDefaultColumns();
      let hash = "";
      defaultColumns.each(column => {
        if (hash) {
          hash += ",";
        }
        hash += column.get("id");
      });
      return hash;
    },
    getCurrentlySelectedColumnsHash() {
      let hash = "";
      this.collection.each(column => {
        if (hash) {
          hash += ",";
        }
        hash += column.get("id");
      });
      return hash;
    },
    setInitialFocus: function() {},
    markShown: function(isShown) {
      this._markedShown = isShown;
    },
    _handleDocumentClick: function(event) {
      if (!this._markedShown) {
        return;
      }
      log.debug(`KN: clicked outside the list => make all items inactive`) && console.log(log.last);
      this.collection.each(model => {
        model.set("active", false);
      });
      const knViewsCollection = this.knGetKnViewsCollection();
      this._handleKnViewsUpdated(knViewsCollection);
      this._checkOnlyOneTabStop();
    },
    _setCanMove: function(model, canMoveUp, canMoveDown) {
      const currentUpValue = model.get("canMoveUp");
      const currentDownValue = model.get("canMoveDown");
      const newValues = {
        canMoveUp: canMoveUp,
        canMoveDown: canMoveDown
      };
      if (!canMoveUp && currentUpValue || !canMoveDown && currentDownValue) {
        const itemView = this.children.findByModel(model);
        const active = model.get("active");
        if (active) {
          itemView.willLooseFocus({
            canMoveUp: canMoveUp,
            canMoveDown: canMoveDown
          });
        }
      }
      model.set(newValues);
    },
    _markFirstAndLastMovable: function() {
      let haveStart = false;
      const lastIndex = this.collection.length - 1;
      this.collection.each((model, index) => {
        const isPinned = model.get("pinned");
        const isPermanentAtEnd = model.get("permanentAtEnd");
        if (isPinned || isPermanentAtEnd) {
          this._setCanMove(model, false, false);
        } else {
          let isNextPermanentAtEnd = false;
          if (index < lastIndex) {
            const next = this.collection.at(index + 1);
            isNextPermanentAtEnd = next.get("permanentAtEnd");
          }
          if (haveStart) {
            this._setCanMove(model, true, index < lastIndex && !isNextPermanentAtEnd);
          } else {
            haveStart = true;
            this._setCanMove(model, false, index < lastIndex && !isNextPermanentAtEnd);
          }
        }
      });
    },
    _setOthersToInactive: function(key) {
      this.collection.each(itemModel => {
        const itemKey = itemModel.get("id");
        if (itemKey !== key) {
          itemModel.set("active", false);
        }
      });
    },
    moveItemUp: function(itemView) {
      const columnName = itemView.model.get("name");
      const index = this._indexFromItemView(itemView);
      if (index !== undefined && index > 0) {
        const modelToRemove = this.collection.at(index - 1);
        const movable = !modelToRemove.get("pinned");
        if (movable) {
          log.debug(`KN: moving up column ${columnName}`) && console.log(log.last);
          const removedModel = this.collection.remove(modelToRemove);
          this.collection.add(removedModel, {
            at: index
          });
          this._markFirstAndLastMovable();
          itemView.knScrollIntoCurrentlyFocusedView();
        } else {
          log.debug(`KN: not moving up column ${columnName}, because it is not movable`) && console.log(log.last);
        }
      } else {
        log.debug(`KN: not moving up column ${columnName}, because already at top position`) && console.log(log.last);
      }
    },
    moveItemDown: function(itemView) {
      const columnName = itemView.model.get("name");
      const index = this._indexFromItemView(itemView);
      if (index !== undefined && index < this.collection.length - 1) {
        log.debug(`KN: moving down column ${columnName}`) && console.log(log.last);
        const modelToRemove = this.collection.at(index + 1);
        const removedModel = this.collection.remove(modelToRemove);
        this.collection.add(removedModel, {
          at: index
        });
        this._markFirstAndLastMovable();
        itemView.knScrollIntoCurrentlyFocusedView();
      } else {
        log.debug(`KN: not moving down column ${columnName}, because already at end position`) && console.log(log.last);
      }
    },
    removeItem: function(itemView) {
      const model = itemView.model;
      const columnName = model.get("name");
      const currentlyFocusedViewIdentifier = itemView.knGetCurrentlyFocusedViewIdentifier();
      const itemViewId = itemView.knGetIdentifier();
      if (itemViewId && itemViewId === currentlyFocusedViewIdentifier) {
        let lastIndex = this.collection.length - 1;
        for (;lastIndex >= 0; lastIndex--) {
          const model = this.collection.at(lastIndex);
          const permanentAtEnd = model.get("permanentAtEnd");
          if (!permanentAtEnd) {
            break;
          }
        }
        const index = this._indexFromItemView(itemView);
        if (index !== undefined) {
          if (index < lastIndex) {
            this.knNavigateToNext();
          } else {
            this.knNavigateToPrev();
          }
        }
      }
      this.collection.remove(model);
      this._markFirstAndLastMovable();
      itemView.knScrollIntoCurrentlyFocusedView();
      log.debug(`KN: removing column ${columnName}`) && console.log(log.last);
    },
    focusFirst: function() {
      this.knNavigateToFirst();
    },
    _handleKnViewsUpdated: function(knViewsCollection) {
      this._knColumnsListUpdateTabStops();
      log.debug(`KN: ### knViews collection (scope ${knViewsCollection.knScope}) changed: ###`) && console.log(log.last);
      this.knGetKnViewsSorted().forEach(knViewInfo => {
        log.debug(`KN: knViews collection (scope ${knViewsCollection.knScope}) has view with id ${knViewInfo.id} (${knViewInfo.view.constructor.name})`) && console.log(log.last);
      });
    },
    _initializeKN: function() {
      this.setupKeyboardNavigationMixin({
        isTabRegion: true,
        tabRegionName: this.constructor.name
      });
      this._knActiveOnCollectionLevel = true;
      const knViewsCollection = this.knGetKnViewsCollection();
      this.listenTo(this, "before:render", view => {
        this._renderingCollection = true;
      });
      this.listenTo(this, "render", view => {
        this._renderingCollection = false;
        this._markFirstAndLastMovable();
        this._handleKnViewsUpdated(knViewsCollection);
      });
      this.listenTo(this, "remove:child", () => {
        if (this._renderingCollection) {
          return;
        }
        this._markFirstAndLastMovable();
        this._handleKnViewsUpdated(knViewsCollection);
      });
      this.listenTo(knViewsCollection, "add", (model, collection, index) => {
        if (this._renderingCollection) {
          return;
        }
        this._markFirstAndLastMovable();
        this._handleKnViewsUpdated(knViewsCollection);
      });
      this._markFirstAndLastMovable();
      document.addEventListener("click", this._boundDocumentClickHandler);
      this.listenTo(this, "destroy", () => {
        document.removeEventListener("click", this._boundDocumentClickHandler);
      });
      this.listenTo(this.collection, "change:active", model => {
        const itemView = this.children.findByModel(model);
        const key = model.get("id");
        const active = model.get("active");
        if (active === false && model.previous("active") === undefined) {
          return;
        }
        log.debug(`KN: active changed for ${key}: ${active}`) && console.log(log.last);
        if (active) {
          this._setOthersToInactive(key);
          itemView.knSetTabStop(false);
        }
        const activeItem = this.collection.findWhere({
          active: true
        });
        this._knActiveOnCollectionLevel = activeItem === undefined;
        log.debug(`KN: active on collection level ${this._knActiveOnCollectionLevel}`) && console.log(log.last);
        if (!active && this._knActiveOnCollectionLevel) {
          itemView.knSetTabStop(true);
          itemView.knFocus();
        }
        itemView._checkTabables.call(itemView);
      });
      this.listenTo(this.collection, "remove", model => {
        const activeItem = this.collection.findWhere({
          active: true
        });
        this._knActiveOnCollectionLevel = activeItem === undefined;
        log.debug(`KN: active on collection level ${this._knActiveOnCollectionLevel}`) && console.log(log.last);
      });
    },
    childViewOptions: function(model, index) {
      return {
        knViewsCollection: this.knGetKnViewsCollection()
      };
    },
    _checkOnlyOneTabStop: function() {
      const tabables = this.el.querySelectorAll('*[tabindex="0"],otc-button:not([tabindex="-1"])');
      const knViewsCollection = this.knGetKnViewsCollection();
      if (this._knActiveOnCollectionLevel) {
        if (tabables.length === 0) {
          throw new Error(`KN: error detected: tab-region (${knViewsCollection.tabRegionName}) has no element acting as tab-stop, but there should be one`);
        }
        if (tabables.length > 1) {
          throw new Error(`KN: error detected: tab-region (${knViewsCollection.tabRegionName}) has ${tabables.length} elements acting as tab-stop, but there should only be one`);
        }
      } else {
        if (tabables.length !== 1) {
          throw new Error(`KN: error detected: tab-region (${knViewsCollection.tabRegionName}) has ${tabables.length} elements acting as tab-stop, but there should not be one`);
        }
        const tabable = tabables[0];
        if (tabable.tagName !== "OTC-BUTTON") {
          throw new Error(`KN: error detected: tab-region (${knViewsCollection.tabRegionName}) has element acting as tab-stop, which is not an otc-button`);
        }
      }
    },
    _knColumnsListUpdateTabStops: function() {
      const knViewsInfos = this.knGetKnViewsSorted();
      if (knViewsInfos.length === 0) {
        return;
      }
      if (this._knActiveOnCollectionLevel) {
        let mustCalculateInitiallyFocused = false;
        if (this._knKeyHandledAtLeastOnce) {
          const currentlyFocusedIndex = this.knGetIndexOfCurrentlyFocusedView(knViewsInfos);
          if (currentlyFocusedIndex < 0) {
            mustCalculateInitiallyFocused = true;
          }
        } else {
          mustCalculateInitiallyFocused = true;
        }
        if (mustCalculateInitiallyFocused) {
          const viewInfo = knViewsInfos[0];
          this.knSetCurrentlyFocusedViewIdentifier(viewInfo.id);
          log.debug(`KN: marked ${viewInfo.id} as initial tab-stop`) && console.log(log.last);
        }
        log.debug(`KN: updating tab-stops`) && console.log(log.last);
        this.knUpdateTabStops(knViewsInfos);
        const currentlyFocusedIndex = this.knGetIndexOfCurrentlyFocusedView(knViewsInfos);
        const knView = knViewsInfos[currentlyFocusedIndex].view;
        knView.knFocus();
      } else {
        log.debug(`KN: columns list not active => remove all tab-stops`) && console.log(log.last);
        this.knRemoveAllTabStops(knViewsInfos);
      }
      this._checkOnlyOneTabStop();
    },
    onEnterItem: function(itemView) {
      const canBeActivated = this._canBeActivated(itemView);
      if (canBeActivated) {
        itemView.model.set("active", true);
      }
    },
    onClickItem: function(itemView) {
      const canBeActivated = this._canBeActivated(itemView);
      if (canBeActivated) {
        itemView.knNavigateToThisView.call(itemView);
      }
    },
    _indexOfItemById: function(id) {
      let index;
      for (let i = 0; i < this.collection.length; i++) {
        if (this.collection.at(i).get("id") === id) {
          index = i;
          break;
        }
      }
      return index;
    },
    _indexFromItemView: function(itemView) {
      const model = itemView.model;
      const id = model.get("id");
      return this._indexOfItemById(id);
    },
    _canBeActivated: function(itemView) {
      const removable = !itemView.model.get("permanent");
      const movable = !(itemView.model.get("pinned") || itemView.model.get("permanentAtEnd"));
      return this._knActiveOnCollectionLevel && (movable || removable);
    },
    onKeyInView: function(event) {
      if (this._knActiveOnCollectionLevel) {
        if (event.ctrlKey || event.metaKey) {
          return;
        }
        switch (event.keyCode) {
         case 37:
         case 38:
          this._knHandleKeyArrowUp(event);
          break;

         case 39:
         case 40:
          this._knHandleKeyArrowDown(event);
          break;

         case 35:
          this._knHandleKeyEnd(event);
          break;

         case 36:
          this._knHandleKeyHome(event);
          break;
        }
      }
    },
    _knHandleKeyArrowUp: function(event) {
      const id = this.knNavigateToPrev();
      if (id) {
        this._knKeyHandledAtLeastOnce = true;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    _knHandleKeyArrowDown: function(event) {
      const id = this.knNavigateToNext();
      if (id) {
        this._knKeyHandledAtLeastOnce = true;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    _knHandleKeyHome: function(event) {
      const id = this.knNavigateToFirst();
      if (id) {
        this._knKeyHandledAtLeastOnce = true;
        event.preventDefault();
        event.stopPropagation();
      }
    },
    _knHandleKeyEnd: function(event) {
      const id = this.knNavigateToLast();
      if (id) {
        this._knKeyHandledAtLeastOnce = true;
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
  KeyboardNavigationMixin.mixin(ColumnsSidePanelSelectedView.prototype);
  return ColumnsSidePanelSelectedView;
});