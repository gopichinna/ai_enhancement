/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "csui/controls/table/cells/select/select.view" ], function(SelectCellView) {
  "use strict";
  var prototype = SelectCellView.prototype, origRenderValue = prototype.renderValue;
  prototype.renderValue = function() {
    this.listenTo(this.model, "change:" + "selectable", function(model, changedValue) {
      this.checkboxView.setDisabled(!changedValue);
    });
    origRenderValue.call(this);
  };
});