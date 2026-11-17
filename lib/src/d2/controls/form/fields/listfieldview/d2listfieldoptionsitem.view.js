/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/mass.update.utils", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldoptionsitem.view" ], function(_, MassUpdateUtils, DctmwListFieldOptionsItem) {
  "use strict";
  return DctmwListFieldOptionsItem.extend({
    constructor: function D2ListFieldSelectionItemView(options) {
      DctmwListFieldOptionsItem.prototype.constructor.call(this, options);
    },
    className: function() {
      return _.result(DctmwListFieldOptionsItem.prototype, "className") + " d2-selectedList";
    },
    onRender: function() {
      DctmwListFieldOptionsItem.prototype.onRender.call(this);
      if (this.options.parentView.options.parentView.model.get("options").massUpdateFileCount && MassUpdateUtils.fieldHasMultipleValues(this.model.get("id"))) {
        this.$el.hide();
      }
    }
  });
});