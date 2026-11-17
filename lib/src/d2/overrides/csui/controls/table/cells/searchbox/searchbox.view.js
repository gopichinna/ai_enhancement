/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/searchbox/searchbox.view" ], function(SearchBoxView) {
  "use strict";
  var prototype = SearchBoxView.prototype;
  var originalSearchBoxClick = prototype._searchBoxClicked;
  var originalSearchFieldGlassClick = prototype._searchFieldGlassClicked;
  SearchBoxView.prototype._searchBoxClicked = function(event) {
    if (this._disabled === true) {
      event.stopPropagation();
    } else {
      originalSearchBoxClick.apply(this, arguments);
    }
  };
  SearchBoxView.prototype._searchFieldGlassClicked = function(event) {
    if (this._disabled === true) {
      event.stopPropagation();
    } else {
      originalSearchFieldGlassClick.apply(this, arguments);
    }
  };
});