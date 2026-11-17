/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldsearch.view" ], function(_, DctmwListFieldSearchView) {
  "use strict";
  return DctmwListFieldSearchView.extend({
    constructor: function D2ListFieldSearchView(options) {
      DctmwListFieldSearchView.prototype.constructor.call(this, options);
    },
    className: function() {
      return _.result(DctmwListFieldSearchView.prototype, "className") + " d2-listfield-search";
    }
  });
});