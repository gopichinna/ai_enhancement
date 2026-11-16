/**
 * @license d2sv-sdk 24.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import {
  CollectionView
} from "nuc/lib/marionette";

import EmptyView from "smart/controls/emptylist/emptylist.view";

import FacetItemView from "d2/controls/facet.panel/impl/facet/facet.item.view";

class FacetColumnItemsCollectionView extends CollectionView {
  className() {
    return "facet-column-items-wrapper";
  }
  childView = FacetItemView;
  constructor(options = {}) {
    super(options);
    this.collection = options.model.nodes;
  }
}

Object.defineProperty(FacetColumnItemsCollectionView.prototype.constructor, "name", {
  value: "FacetColumnItemsCollectionView"
});

class FacetColumnCollectionView extends CollectionView {
  emptyView = EmptyView;
  childView = FacetColumnItemsCollectionView;
  constructor(options = {}) {
    super(options);
  }
  childEvents() {
    return {
      "childview:single:filter:select": "onSingleFilterSelect",
      "childview:multi:filter:select": "onMultiFilterSelect",
      "childview:multi:filter:unselect": "onMultiFilterUnselect"
    };
  }
  className() {
    return "facet-column-view";
  }
  onSingleFilterSelect(childView, itemView) {
    this.trigger("single:filter:selection", itemView.model);
  }
  onMultiFilterSelect(childView, itemView) {
    this.trigger("filter:multi:select", itemView.model);
  }
  onMultiFilterUnselect(childView, itemView) {
    this.trigger("filter:multi:unselect", itemView.model);
  }
}

Object.defineProperty(FacetColumnCollectionView.prototype.constructor, "name", {
  value: "FacetColumnCollectionView"
});

export default FacetColumnCollectionView;