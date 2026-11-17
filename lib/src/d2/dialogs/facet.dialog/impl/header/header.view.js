/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import HeaderView from "d2/dialogs/target.browse/impl/header/header.view";

import FacetSearchBoxView from "d2/dialogs/facet.dialog/impl/header/facet.search.box";

import "css!d2/dialogs/facet.dialog/impl/header/header";

class FacetDialogHeaderView extends HeaderView {
  constructor(options = {}) {
    options.globalSearch = true;
    super(options);
  }
  initialize() {
    this.searchBoxView = new FacetSearchBoxView({
      targetBrowseSearch: true
    });
    this.searchboxModel = this.searchBoxView.searchboxModel;
    this.searchQueryModel = this.searchBoxView.model;
    this.listenTo(this.searchBoxView, "change:searchterm", model => {
      this.trigger("change:filter", model);
    });
  }
}

Object.defineProperty(FacetDialogHeaderView.prototype.constructor, "name", {
  value: "FacetDialogHeaderView"
});

export default FacetDialogHeaderView;