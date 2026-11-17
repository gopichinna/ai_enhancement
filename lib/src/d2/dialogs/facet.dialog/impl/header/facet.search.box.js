/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
import _ from "nuc/lib/underscore";

import $ from "nuc/lib/jquery";

import SearchBoxView from "d2/dialogs/target.browse/impl/header/search.box/search.box.view";

class FacetSearchBoxView extends SearchBoxView {
  constructor(...args) {
    super(...args);
  }
  events() {
    let events = super.events;
    delete events["keydown @ui.input"];
    events["keyup @ui.input"] = _.throttle(this.onInputKeyDown.bind(this), 500);
    return events;
  }
  showOptionsDropdown(event) {
    event.stopPropagation();
    const $el = $(event.target);
    $el.attr("data-value", $el.val());
  }
  onRender() {}
  _updatePerspective() {}
  onInputKeyDown(event) {
    this.lastKeyCode = event.keyCode;
    var d2Input = this.$el.find(".d2-input");
    var value = d2Input.val();
    this._setSearchQuery(value);
  }
  clearInput(event) {
    event?.stopPropagation();
    this._setSearchQuery("");
    super.clearInput();
  }
}

Object.defineProperty(FacetSearchBoxView.prototype.constructor, "name", {
  value: "FacetSearchBoxView"
});

export default FacetSearchBoxView;