/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import PaginationView from "csui/controls/pagination/nodespagination.view";

class FacetPaginationView extends PaginationView {
  constructor(options) {
    super(options);
    this.stopListening(this.collection, "reset", this.collectionChange);
    this.stopListening(this.collection, "add", this._maintainPageSize);
    this.stopListening(this.collection, "remove", this._maintainPageSize);
  }
}

Object.defineProperty(FacetPaginationView.prototype.constructor, "name", {
  value: "FacetPaginationView"
});

export default FacetPaginationView;