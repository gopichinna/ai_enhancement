/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldoptions.view", "d2/controls/form/fields/listfieldview/d2listfieldoptionsitem.view" ], function(_, DctmwListOptionsView, ListFieldOptionsItemView) {
  "use strict";
  return DctmwListOptionsView.extend({
    childView: ListFieldOptionsItemView,
    constructor: function D2ListOptionsView() {
      DctmwListOptionsView.prototype.constructor.apply(this, arguments);
    },
    className: function() {
      return _.result(DctmwListOptionsView.prototype, "className") + " d2-listfield-options-wrapper";
    },
    onRender: function(view, visible) {
      DctmwListOptionsView.prototype.onRender.call(this, view, visible);
      this.ui.options.addClass("d2-listfield-options");
    }
  });
});