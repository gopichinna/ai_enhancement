/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import {
  LayoutView
} from "nuc/lib/marionette";

import BlockingView from "csui/controls/progressblocker/blocker";

import TabableRegionBehavior from "csui/behaviors/keyboard.navigation/tabable.region.behavior";

import LayoutViewEventsPropagationMixin from "smart/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin";

import FacetColumnCollectionView from "d2/dialogs/facet.dialog/impl/content/facet.column.view";

import FacetPaginationView from "d2/dialogs/facet.dialog/impl/content/facet.dialog.pagination.view";

import {
  buildSubCollection,
  updateHighlightString,
  unSelectAllModels
} from "d2/dialogs/facet.dialog/impl/facet.dialog.utils";

import FacetDialogKeyNavigationMixin from "d2/dialogs/facet.dialog/impl/content/facet.dialog.key.navigation.mixin";

import template from "hbs!d2/dialogs/facet.dialog/impl/content/facet.content.view";

import "css!d2/dialogs/facet.dialog/impl/content/facet.content.view";

class FacetDialogContentView extends LayoutView {
  template = template;
  constructor(options = {}) {
    super(options);
  }
  behaviors() {
    return {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    };
  }
  ui() {
    return {
      container: ".rgn-facet-content-container"
    };
  }
  events() {
    return {
      "keydown @ui.container": "onKeyInView"
    };
  }
  regions() {
    return {
      rgnPaginationView: ".rgn-pagination-bar",
      rgnContentView: ".rgn-facet-content-container"
    };
  }
  initialize() {
    const columnsCount = this.options.COLUMNS_COUNT, defaultRowsCount = this.options.ROWS_PER_COLUMN;
    this.columnCollection = buildSubCollection(this.collection.models, columnsCount, defaultRowsCount);
    this.columnCollectionView = new FacetColumnCollectionView({
      collection: this.columnCollection
    });
    this.paginationView = new FacetPaginationView({
      collection: this.collection,
      pageSize: this.options.pageSize,
      defaultDDList: this.options.defaultDDList,
      skipPaginationUpdateRequest: true,
      blockingParentView: this
    });
    this.listenTo(this.collection, "sync reset", () => {
      this._resetPosition();
      if (this.collection.length > 0) {
        updateHighlightString(this.collection.filteredOn, this.collection.models);
        let newCollection = buildSubCollection(this.collection.models, columnsCount, Math.floor(this.collection.topCount / columnsCount) || defaultRowsCount);
        this.columnCollection.reset(newCollection.models);
      } else {
        this.columnCollection.reset();
      }
      this.paginationView.collectionChange();
    });
    this._resetPosition();
    this._attachListeners();
    this.propagateEventsToRegions();
  }
  _attachListeners() {
    if (this.options.blockingParentView) {
      BlockingView.delegate(this, this.options.blockingParentView);
    } else {
      BlockingView.imbue(this);
    }
    this.listenTo(this.columnCollectionView, {
      "single:filter:selection": this.onSingleSelect,
      "filter:multi:select": this.onMultiSelect,
      "filter:multi:unselect": this.onMultiUnselect
    });
    this.listenTo(this.collection, "filter:start ", this.blockActions.bind(this)).listenTo(this.collection, "filter:end", this.unblockActions.bind(this));
  }
  onSingleSelect(model) {
    let {
      newSelectionIds
    } = this.options.selectionData;
    unSelectAllModels(this.columnCollection);
    model.set("checked", true);
    newSelectionIds.clear();
    newSelectionIds.add(model.get("id"));
  }
  onMultiSelect(model) {
    let {
      oldSelectionIds,
      unSelectionIds,
      newSelectionIds
    } = this.options.selectionData;
    let id = model.get("id");
    if (unSelectionIds.has(id)) {
      unSelectionIds.delete(id);
    }
    if (!oldSelectionIds.has(id)) {
      newSelectionIds.add(id);
    }
  }
  onMultiUnselect(model) {
    let {
      oldSelectionIds,
      unSelectionIds,
      newSelectionIds
    } = this.options.selectionData;
    let id = model.get("id");
    if (oldSelectionIds.has(id)) {
      unSelectionIds.add(id);
    }
    newSelectionIds.delete(id);
  }
  onRender() {
    this.rgnPaginationView.show(this.paginationView);
    this.rgnContentView.show(this.columnCollectionView);
    this.paginationView.collectionChange();
  }
  onDomRefresh() {
    this.paginationView?.triggerMethod("dom:refresh");
  }
  onAfterShow() {
    this.paginationView.collectionChange();
  }
}

FacetDialogKeyNavigationMixin.mixin(FacetDialogContentView.prototype);

LayoutViewEventsPropagationMixin.mixin(FacetDialogContentView.prototype);

Object.defineProperty(FacetDialogContentView.prototype.constructor, "name", {
  value: "FacetDialogContentView"
});

export default FacetDialogContentView;