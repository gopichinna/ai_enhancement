/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "d2/utils/mass.update.utils", "dctmw/controls/form/fields/listfieldview/dctmwlistfieldselectionitem.view" ], function(_, MassUpdateUtils, DctmwListFieldSelectionItem) {
  "use strict";
  return DctmwListFieldSelectionItem.extend({
    constructor: function D2ListFieldSelectionItemView(options) {
      DctmwListFieldSelectionItem.prototype.constructor.call(this, options);
    },
    onRender: function() {
      var listFieldView = this.options.parentView.options.parentView;
      if (listFieldView && listFieldView.model.get("options").massUpdateFileCount) {
        var multiValue = MassUpdateUtils.fieldHasMultipleValues(this.model.get("id")), multiValueItem = multiValue && this.$el;
        multiValueItem && multiValueItem.find(".dctmw-listfield-icon-container").removeClass("dctmw-icon-drag");
        multiValueItem && multiValueItem.addClass("dctmw-listfield-multivalue-item");
      }
      DctmwListFieldSelectionItem.prototype.onRender.call(this);
    }
  });
});