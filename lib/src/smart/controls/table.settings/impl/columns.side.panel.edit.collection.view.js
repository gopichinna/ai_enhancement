/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/lib/marionette", "nuc/utils/log", "smart/controls/table.settings/impl/keyboard.navigation.mixin", "smart/controls/table.settings/impl/columns.side.panel.edit.item.view" ], function(module, _, Backbone, Marionette, logUtil, KeyboardNavigationMixin, ColumnsSidePanelEditItemView) {
  const log = logUtil(module.id);
  const ColumnsSidePanelEditCollectionView = Marionette.CollectionView.extend({
    childView: ColumnsSidePanelEditItemView,
    className: "smart-table-settings-columns-edit-collection-view",
    tagName: "ol",
    events: {
      keydown: "onKeyInView"
    },
    constructor: function ColumnsSidePanelEditCollectionView() {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.options || (this.options = {});
      this.allColumnsCollection = this.options.allColumns;
      this.selectedColumns = this.options.selectedColumns;
      this.collection = this.options.collection;
      this._initializeKN();
    },
    onRender: function() {
      this.el.setAttribute("id", this.options.groupId);
      this.el.setAttribute("role", "menu");
      this.el.setAttribute("aria-label", this.options.groupName);
    },
    childViewOptions: function(model, index) {
      return {
        knViewsCollection: this.knGetKnViewsCollection()
      };
    },
    onKeyInView: function(event) {
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
    },
    _initializeKN: function() {
      this.setupKeyboardNavigationMixin({
        isTabRegion: true,
        tabRegionName: this.constructor.name
      });
      const knViewsCollection = this.knGetKnViewsCollection();
      this.listenTo(this, "before:render", view => {
        this._renderingCollection = true;
      });
      this.listenTo(this, "render", view => {
        this._renderingCollection = false;
        this._handleKnViewsUpdated(knViewsCollection);
      });
      this.listenTo(this, "remove:child", () => {
        if (this._renderingCollection) {
          return;
        }
        this._handleKnViewsUpdated(knViewsCollection);
      });
      this.listenTo(knViewsCollection, "add", (model, collection, index) => {
        if (this._renderingCollection) {
          return;
        }
        this._handleKnViewsUpdated(knViewsCollection);
      });
    },
    _handleKnViewsUpdated: function(knViewsCollection) {
      this._knColumnsEditListUpdateTabStops();
      log.debug(`KN: ### knViews collection (scope ${knViewsCollection.knScope}) changed: ###`) && console.log(log.last);
      this.knGetKnViewsSorted().forEach(knViewInfo => {
        log.debug(`KN: knViews collection (scope ${knViewsCollection.knScope}) has view with id ${knViewInfo.id} (${knViewInfo.view.constructor.name})`) && console.log(log.last);
      });
    },
    _knColumnsEditListUpdateTabStops: function() {
      const knViewsInfos = this.knGetKnViewsSorted();
      if (knViewsInfos.length === 0) {
        return;
      }
      const currentlyFocusedViewId = this.knGetCurrentlyFocusedViewIdentifier();
      const f = knViewsInfos.filter(vi => {
        return vi.id === currentlyFocusedViewId;
      });
      if (f.length === 0) {
        this._knKeyHandledAtLeastOnce = false;
      }
      if (!this._knKeyHandledAtLeastOnce && knViewsInfos.length > 0) {
        let haveTabable = false;
        for (const knViewsInfo of knViewsInfos) {
          const view = knViewsInfo.view;
          const model = view.model;
          this.knSetCurrentlyFocusedViewIdentifier(knViewsInfo.id);
          haveTabable = true;
          log.debug(`KN: marked ${knViewsInfo.id} as initial tab-stop`) && console.log(log.last);
          break;
        }
        if (!haveTabable) {
          this.knSetCurrentlyFocusedViewIdentifier("");
          log.info(`KN: no item found for initial tab-stop`) && console.log(log.last);
        }
      }
      log.debug(`KN: updating tab-stops`) && console.log(log.last);
      this.knUpdateTabStops(knViewsInfos);
      this._checkOnlyOneTabStop();
    },
    _checkOnlyOneTabStop: function() {
      const knViewsCollection = this.knGetKnViewsCollection();
      if (knViewsCollection.length > 0) {
        const currentlyFocusedId = this.knGetCurrentlyFocusedViewIdentifier();
        if (currentlyFocusedId) {
          const tabables = this.el.querySelectorAll('*[tabindex="0"],otc-checkbox:not([tabindex="-1"])');
          const knViewsCollection = this.knGetKnViewsCollection();
          if (tabables.length !== 1) {
            throw new Error(`KN: error detected: expected tab-region (${knViewsCollection.tabRegionName}) has one element acting as tab-stop, but there are ${tabables.length}`);
          }
        }
      }
    }
  });
  KeyboardNavigationMixin.mixin(ColumnsSidePanelEditCollectionView.prototype);
  return ColumnsSidePanelEditCollectionView;
});